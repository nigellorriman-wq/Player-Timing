import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
 
  // Lazy initialize AI client to avoid crash if key is missing on startup
  let aiClient: GoogleGenerativeAI | null = null;
  function getAI() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenerativeAI(key);
    }
    return aiClient;
  }

  // Debug middleware
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

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
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              round: { type: SchemaType.STRING },
              paceOfPlay: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    hole: { type: SchemaType.NUMBER },
                    minutes: { type: SchemaType.NUMBER },
                  },
                  required: ["hole", "minutes"],
                },
              },
              groups: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    groupNumber: { type: SchemaType.STRING },
                    startTime: { type: SchemaType.STRING },
                    startingTee: { type: SchemaType.NUMBER },
                    players: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                    },
                  },
                  required: ["groupNumber", "startTime", "players"],
                },
              },
            },
            required: ["name", "round", "paceOfPlay", "groups"],
          },
        }
      });
 
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        "Extract tournament information from this golf start list. Include tournament name, round number, group numbers, start times, starting tees, players (full names), and pace of play (minutes per hole for holes 1-18)."
      ]);
 
      res.json(JSON.parse(result.response.text() || '{}'));
    } catch (error) {
      console.error("[SERVER] PDF parsing error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse PDF" });
    }
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
