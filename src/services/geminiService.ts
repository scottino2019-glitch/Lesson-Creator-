/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyLevel, LessonChapter } from "../types";

export async function generateLesson(
  language: string,
  level: DifficultyLevel,
  topic: string
): Promise<LessonChapter> {
  const response = await fetch("/api/generate-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, level, topic }),
  });

  if (!response.ok) {
    let errorMessage =
      response.status === 503
        ? "Servizio temporaneamente non disponibile (errore 503). Riprova tra qualche secondo."
        : `Errore imprevisto durante la generazione (${response.status}).`;
    try {
      const errBody = await response.json();
      if (errBody?.error) {
        errorMessage = errBody.error;
      }
    } catch {
      // Keep status-based error message
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as LessonChapter;
}
