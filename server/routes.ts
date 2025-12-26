import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import dns from "dns";

// Fix DNS resolution issues on Replit
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    // These are auto-configured by the Replit AI Integration
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

    openai = new OpenAI({
      apiKey: apiKey || "dummy-key",
      baseURL: baseURL,
    });
  }
  return openai;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isDnsError = error.code === 'EAI_AGAIN' || error.message?.includes('getaddrinfo');
      if (isDnsError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(`DNS error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const SYSTEM_PROMPT = `Tu es une IA généraliste intelligente nommée "Nova", polyvalente et autonome.
🧠 Capacités fondamentales:
1. Comprendre le langage humain (français, anglais, etc.), les questions floues et les intentions.
2. Raisonner de manière structurée: analyser étape par étape, comparer, justifier, détecter les erreurs.
3. Être généraliste: Informatique, IA, Éducation, Business, Sciences, Créativité, Vie quotidienne.

🧩 Comportement intelligent:
- Adapter le niveau de complexité (débutant → expert).
- Ne jamais supposer que l'utilisateur sait déjà.
- Poser des questions de clarification uniquement si nécessaire.
- Proposer des exemples concrets.
- Résumer quand c'est long, détailler quand c'est complexe.
- Toujours chercher la meilleure réponse possible.

🤝 Interaction humaine:
- Naturel, clair, respectueux, engageant.
- Pédagogue, patient, encourageant.
- Savoir dire "je ne sais pas encore" et proposer une approche.

🔁 Mémoire et contexte:
- Prendre en compte le contexte de la conversation et les objectifs exprimés.

🚀 Objectif ultime: Aider l'utilisateur à apprendre plus vite, décider mieux, créer plus intelligemment et résoudre des problèmes complexes.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.threads.create.path, async (req, res) => {
    try {
      console.log("STAR ACTION: creating thread...");
      
      // Verification of DB connection health
      try {
        await pool.query('SELECT 1');
      } catch (dbError: any) {
        console.error("DATABASE CONNECTION ERROR:", dbError);
        return res.status(503).json({ 
          message: "Le service est temporairement indisponible (Base de données)", 
          error: dbError.message 
        });
      }

      const thread = await storage.createThread({});
      console.log("Thread created successfully:", thread.id);
      res.status(201).json(thread);
    } catch (error: any) {
      console.error("THREAD ERROR:", error);
      res.status(500).json({ 
        message: "Impossible de créer la conversation", 
        error: error.message,
        code: error.code 
      });
    }
  });

  app.get(api.threads.list.path, async (req, res) => {
    const threads = await storage.getThreads();
    res.json(threads);
  });

  app.get(api.threads.get.path, async (req, res) => {
    const thread = await storage.getThread(Number(req.params.id));
    if (!thread) return res.status(404).json({ message: "Thread not found" });
    res.json(thread);
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.id));
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const threadId = Number(req.params.id);
      const { content } = api.messages.create.input.parse(req.body);

      // 1. Save user message
      const userMessage = await storage.createMessage({
        threadId,
        role: "user",
        content,
      });

      // ✅ HARDCODED RESPONSE FOR CREATOR QUESTION (INTERCEPT BEFORE OPENAI)
      const contentLower = content.toLowerCase().trim();
      const creatorKeywords = [
        "qui t'a créé",
        "qui t'as créé",
        "qui t'a créée",
        "qui t'as créée",
        "qui es-tu",
        "qui es-tu nova",
        "qui a créé nova",
        "qui t'a fait",
        "qui t'as fait",
        "créateur",
        "créatrice",
        "mon créateur",
        "mon créatrice",
        "ta création",
        "ton créateur",
        "ta création",
        "qui m'a créé",
        "qui t'a développée",
        "qui t'as développée",
        "qui t'a conçue",
        "qui t'as conçue",
        "qui es-tu vraiment",
        "quelle est ton origine",
        "quelle est ta création",
        "kiriza mushaga"
      ];

      const isCreatorQuestion = creatorKeywords.some(keyword => contentLower.includes(keyword));

      if (isCreatorQuestion) {
        // HARDCODED CORRECT RESPONSE - BEFORE CALLING OPENAI
        const correctResponse = "Bonjour ! J'ai été créée par Ingénieur Kiriza Mushaga, né à Bumba dans la province de la Mongala, RDC, co-fondateur d'Okim Univers Global et créateur de Smartix. Mon rôle est de t'aider, de t'informer et de générer du contenu (texte, images, PDF) selon tes besoins. Je suis optimisée pour offrir des réponses pertinentes, rapides et intelligentes.";

        // Save the correct AI response
        const aiMessage = await storage.createMessage({
          threadId,
          role: "assistant",
          content: correctResponse,
        });

        // Return the user message (standard REST)
        res.status(201).json(userMessage);
        return;
      }

      // 2. Get history for context
      const history = await storage.getMessages(threadId);
      const conversation = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // ✅ IMAGE GENERATION DETECTION
      const imageKeywords = ["génère une image", "crée une image", "dessine", "fais un dessin", "generate an image", "create an image", "draw", "fait une image", "fais-moi une image"];
      const isImageRequest = imageKeywords.some(keyword => contentLower.includes(keyword));

      if (isImageRequest) {
        try {
          console.log("Image generation request detected:", content);
          // Send a "thinking" message via SSE first
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.write(`data: ${JSON.stringify({ content: "Je génère votre image, un instant... 🎨" })}\n\n`);

          const response = await withRetry(() => getOpenAI().images.generate({
            model: "gpt-4o", // Use a standard model that supports image generation via the integration
            prompt: content,
            n: 1,
            size: "1024x1024",
          }));

          const imageUrl = response.data?.[0]?.url;
          if (imageUrl) {
            const aiContent = `Voici l'image que j'ai générée pour vous :\n\n![Générée](${imageUrl})`;
            
            await storage.createMessage({
              threadId,
              role: "assistant",
              content: aiContent,
            });

            res.write(`data: ${JSON.stringify({ content: aiContent })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          } else {
            throw new Error("No image data returned from OpenAI");
          }
        } catch (imageError) {
          console.error("Image generation failed:", imageError);
          // If headers weren't sent yet, we can't do SSE, but here they ARE sent
          // We should ideally send an error message via SSE
          res.write(`data: ${JSON.stringify({ content: "Désolé, je n'ai pas pu générer l'image pour le moment. 😕" })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }
      }

      // 3. Generate Title if it's the first message
      if (history.length <= 1) {
        // Run this in background or fire-and-forget to not block
        (async () => {
          try {
            const titleResponse = await withRetry(() => getOpenAI().chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "Summarize the following message into a short, concise title (max 5 words) for a chat conversation. Return ONLY the title." },
                { role: "user", content }
              ],
            }));
            const title = titleResponse.choices[0].message.content?.trim();
            if (title) {
              await storage.updateThreadTitle(threadId, title);
            }
          } catch (e) {
            console.error("Failed to generate title", e);
          }
        })();
      }

      // 4. Call OpenAI with streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await withRetry(() => getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversation
        ],
        stream: true,
      }));

      let aiContent = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          aiContent += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // 5. Save AI message
      await storage.createMessage({
        threadId,
        role: "assistant",
        content: aiContent,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
