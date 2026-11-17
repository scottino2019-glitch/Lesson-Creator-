import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/generate-lesson", async (req: Request, res: Response) => {
  try {
    const { language, level, topic } = req.body ?? {};

    if (!language || !level || !topic) {
      return res.status(400).json({
        error: "Parametri mancanti: language, level e topic sono obbligatori.",
      });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY non configurata. Verifica Settings > Secrets.",
      });
    }

    const systemInstruction = `Sei un esperto creatore di corsi di lingua professionali. 
  Il tuo compito è generare capitoli di un libro di testo.
  Mantieni la lezione ben strutturata e concisa:
  - 6-8 battute di dialogo naturale
  - 6-8 vocaboli essenziali
  - 2 punti grammaticali chiari con 2-3 esempi ciascuno
  - 4-5 esercizi vari e pratici

  REQUISITO CRITICO PER GLI ESERCIZI:
  - Gli esercizi DEVONO essere compiti pratici che lo studente deve svolgere.
  - ESEMPIO SBAGLIATO (NON FARLO): "Esempio di frase: Io vado a casa."
  - ESEMPIO CORRETTO: "Traduci la seguente frase in ${language}: 'Io vado a casa'."
  - Ogni esercizio deve avere una domanda interrogativa o un'istruzione imperativa.
  - All'interno del campo 'answer', fornisci la soluzione corretta.
  - Se il tipo è 'multiple-choice', il campo 'options' deve contenere esattamente 4 opzioni.
  
  TUTTE le spiegazioni, i titoli delle sezioni e le traduzioni devono essere in ITALIANO.`;

    const prompt = `Crea una lezione completa per la lingua ${language} (livello ${level}) sull'argomento: "${topic}".`;

    const responseSchema = {
      type: Type.OBJECT,
      required: [
        "id",
        "title",
        "difficulty",
        "dialogue",
        "vocabulary",
        "grammar",
        "exercises",
      ],
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        dialogue: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["speaker", "text", "translation"],
            properties: {
              speaker: { type: Type.STRING },
              text: { type: Type.STRING },
              translation: { type: Type.STRING },
            },
          },
        },
        vocabulary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["word", "translation", "example"],
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              example: { type: Type.STRING },
            },
          },
        },
        grammar: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "explanation", "examples"],
            properties: {
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["question", "type", "answer"],
            properties: {
              question: {
                type: Type.STRING,
                description: "Un'istruzione o domanda pratica per lo studente",
              },
              type: {
                type: Type.STRING,
                enum: ["multiple-choice", "fill-in-the-blank", "translation"],
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Obbligatorio solo se type è multiple-choice",
              },
              answer: {
                type: Type.STRING,
                description: "La soluzione corretta dell'esercizio",
              },
              explanation: {
                type: Type.STRING,
                description: "Perché questa è la risposta corretta",
              },
            },
          },
        },
      },
    };

    const attempts = [
      {
        model: "gemini-4-hydrogen",
        timeoutMs: 10000,
        thinkingLevel: ThinkingLevel.LOW,
      },
      {
        model: "gemini-3.1-flash-lite",
        timeoutMs: 25000,
        thinkingLevel: undefined,
      },
    ];

    let response;
    let lastError: unknown;

    for (let i = 0; i < attempts.length; i++) {
      const { model, timeoutMs, thinkingLevel } = attempts[i];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
            abortSignal: controller.signal,
            ...(thinkingLevel
              ? { thinkingConfig: { thinkingLevel } }
              : {}),
          },
        });
        clearTimeout(timer);
        break;
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const name = err instanceof Error ? err.name : "";
        const isTransient =
          name === "AbortError" ||
          msg.includes("aborted") ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED");
        if (!isTransient || i === attempts.length - 1) {
          throw err;
        }
      }
    }

    if (!response) {
      throw lastError ?? new Error("Nessuna risposta dal modello.");
    }

    let text = response.text;
    if (!text) {
      return res.status(502).json({
        error:
          "L'AI non ha risposto. Riprova con un argomento diverso o controlla la connessione.",
      });
    }

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.status(502).json({
        error: "Errore nel formato della risposta AI. Riprova.",
      });
    }
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "Errore imprevisto del server.";
    if (
      message.includes("API key") ||
      message.includes("API_KEY") ||
      message.includes("403")
    ) {
      return res.status(400).json({
        error:
          "Chiave API non valida o mancante. Controlla Settings > Secrets.",
      });
    }
    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("aborted")
    ) {
      return res.status(503).json({
        error:
          "Il servizio AI è momentaneamente sovraccarico (503). Riprova tra qualche secondo.",
      });
    }
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
