import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
    const thread = await storage.createThread({});
    res.status(201).json(thread);
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

      // 2. Get history for context
      const history = await storage.getMessages(threadId);
      const conversation = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // 3. Generate Title if it's the first message
      if (history.length <= 1) {
        // Run this in background or fire-and-forget to not block
        (async () => {
          try {
            const titleResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "Summarize the following message into a short, concise title (max 5 words) for a chat conversation. Return ONLY the title." },
                { role: "user", content }
              ],
            });
            const title = titleResponse.choices[0].message.content?.trim();
            if (title) {
              await storage.updateThreadTitle(threadId, title);
            }
          } catch (e) {
            console.error("Failed to generate title", e);
          }
        })();
      }

      // 4. Call OpenAI
      // Streaming would be ideal, but for MVP we'll do blocking request first or setup streaming logic
      // For simplicity in this step, we'll do a simple response.
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversation
        ],
      });

      const aiContent = completion.choices[0].message.content || "Je n'ai pas pu générer de réponse.";

      // 5. Save AI message
      const aiMessage = await storage.createMessage({
        threadId,
        role: "assistant",
        content: aiContent,
      });

      // Return the AI message (or user message + trigger reload, but returning AI message is better for UI response if blocking)
      // The frontend probably expects the created message (user's), but ideally we want to show the AI response too.
      // Let's stick to the route contract: it creates a message (the user's). 
      // The UI should then poll or we return both? 
      // Actually, standard REST is return the created resource.
      // But we also created an AI message side-effect.
      // Let's return the user message, and let the UI fetch the list again or use a specialized response.
      // Or, better, return the AI message as well?
      // For strict REST, we return the user message. 
      
      res.status(201).json(userMessage);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
