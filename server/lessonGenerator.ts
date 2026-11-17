import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export class LessonGenerationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function generateLessonChapter(
  language: string,
  level: string,
  topic: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LessonGenerationError(
      "GEMINI_API_KEY non configurata nelle variabili d'ambiente del server.",
      500
    );
  }

  const aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

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
          ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
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
    throw new LessonGenerationError(
      "L'AI non ha risposto. Riprova con un argomento diverso o controlla la connessione.",
      502
    );
  }

  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    throw new LessonGenerationError(
      "Errore nel formato della risposta AI. Riprova.",
      502
    );
  }
}

export function mapLessonError(error: unknown): { status: number; message: string } {
  if (error instanceof LessonGenerationError) {
    return { status: error.status, message: error.message };
  }
  const message =
    error instanceof Error ? error.message : "Errore imprevisto del server.";
  if (
    message.includes("API key") ||
    message.includes("API_KEY") ||
    message.includes("403")
  ) {
    return {
      status: 400,
      message: "Chiave API non valida o mancante. Controlla le impostazioni Secrets / Environment Variables.",
    };
  }
  if (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("aborted")
  ) {
    return {
      status: 503,
      message:
        "Il servizio AI è momentaneamente sovraccarico (503). Riprova tra qualche secondo.",
    };
  }
  return { status: 500, message };
}
