import {
  generateLessonChapter,
  mapLessonError,
} from "../../server/lessonGenerator.ts";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non consentito." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      language?: string;
      level?: string;
      topic?: string;
    };
    const { language, level, topic } = body;

    if (!language || !level || !topic) {
      return new Response(
        JSON.stringify({
          error:
            "Parametri mancanti: language, level e topic sono obbligatori.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const lesson = await generateLessonChapter(language, level, topic);
    return new Response(JSON.stringify(lesson), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Netlify Gemini function error:", error);
    const { status, message } = mapLessonError(error);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
