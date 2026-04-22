/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel, LessonChapter } from "../types";

// Always prefer process.env.GEMINI_API_KEY as per instructions
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("ATTENZIONE: GEMINI_API_KEY non trovata in process.env. Verificare i segreti.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateLesson(
  language: string, 
  level: DifficultyLevel, 
  topic: string,
  userApiKey?: string
): Promise<LessonChapter> {
  console.log(`Avvio generazione lezione: ${language}, ${level}, ${topic}`);

  const activeApiKey = userApiKey || apiKey || "";
  const aiClient = new GoogleGenAI({ apiKey: activeApiKey });

  const systemInstruction = `Sei un esperto creatore di corsi di lingua professionali. 
  Il tuo compito è generare capitoli di un libro di testo.
  REQUISITO CRITICO PER GLI ESERCIZI:
  - Gli esercizi DEVONO essere compiti pratici che lo studente deve svolgere.
  - ESEMPIO SBAGLIATO (NON FARLO): "Esempio di frase: Io vado a casa."
  - ESEMPIO CORRETTO: "Traduci la seguente frase in ${language}: 'Io vado a casa'."
  - Ogni esercizio deve avere una domanda interrogativa o un'istruzione imperativa.
  - All'interno del campo 'answer', fornisci la soluzione corretta.
  - Se il tipo è 'multiple-choice', il campo 'options' deve contenere esattamente 4 opzioni.
  
  TUTTE le spiegazioni, i titoli delle sezioni e le traduzioni devono essere in ITALIANO.`;

  const prompt = `Crea una lezione completa per la lingua ${language} (livello ${level}) sull'argomento: "${topic}".`;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8,
        responseSchema: {
          type: Type.OBJECT,
          required: ["id", "title", "difficulty", "dialogue", "vocabulary", "grammar", "exercises"],
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
                  translation: { type: Type.STRING }
                }
              }
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
                  example: { type: Type.STRING }
                }
              }
            },
            grammar: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "explanation", "examples"],
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["question", "type", "answer"],
                properties: {
                  question: { type: Type.STRING, description: "Un'istruzione o domanda pratica per lo studente" },
                  type: { type: Type.STRING, enum: ["multiple-choice", "fill-in-the-blank", "translation"] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Obbligatorio solo se type è multiple-choice" },
                  answer: { type: Type.STRING, description: "La soluzione corretta dell'esercizio" },
                  explanation: { type: Type.STRING, description: "Perché questa è la risposta corretta" }
                }
              }
            }
          }
        }
      }
    });

    let text = response.text;
    
    if (!text) {
      console.error("Risposta vuota ricevuta da Gemini.");
      throw new Error("L'AI non ha risposto. Riprova con un argomento diverso o controlla la connessione.");
    }

    // Pulizia del testo per garantire che sia un JSON valido (rimuove eventuali backticks se presenti nonostante mimeType)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      console.log("Lezione generata con successo.");
      return parsed;
    } catch (parseError) {
      console.error("Errore di parsing JSON:", parseError, "Testo:", text);
      throw new Error("Errore nel formato della risposta AI. Riprova.");
    }
  } catch (error: any) {
    console.error("Gemini Critical Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Chiave API non valida o mancante. Controlla le impostazioni.");
    }
    throw error;
  }
}
