import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Debug middleware
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

  // Lazy initialize AI client to avoid crash if key is missing on startup
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI(key);
    }
    return aiClient;
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Parse PDF endpoint
  app.post("/api/parse-pdf", async (req, res) => {
    console.log("[SERVER] POST /api/parse-pdf called");
    try {
      const { base64Data } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Missing base64Data" });
      }

      const ai = getAI();
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data,
                },
              },
              {
                text: "Extract tournament information from this golf start list. Include tournament name, round number, group numbers, start times, starting tees, players (full names), and pace of play (minutes per hole for holes 1-18).",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              round: { type: Type.STRING },
              paceOfPlay: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hole: { type: Type.NUMBER },
                    minutes: { type: Type.NUMBER },
                  },
                  required: ["hole", "minutes"],
                },
              },
              groups: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    groupNumber: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    startingTee: { type: Type.NUMBER },
                    players: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    holeTimes: {
                      type: Type.OBJECT,
                      description: "Map of hole number (as string) to expected finish time (string HH:MM)",
                      additionalProperties: { type: Type.STRING }
                    }
                  },
                  required: ["groupNumber", "startTime", "players"],
                },
              },
            },
            required: ["name", "round", "paceOfPlay", "groups"],
          },
        }
      });

      const text = result.response.text();
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("[SERVER] PDF parsing error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse PDF" });
    }
  });

  // Catch-all for other /api routes to prevent them falling through to Vite SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
