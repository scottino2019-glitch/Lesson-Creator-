import "dotenv/config";
import express, { type Request, type Response } from "express";
import path from "path";
import {
  generateLessonChapter,
  mapLessonError,
} from "./server/lessonGenerator.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

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

    const lesson = await generateLessonChapter(language, level, topic);
    return res.json(lesson);
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const { status, message } = mapLessonError(error);
    return res.status(status).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
