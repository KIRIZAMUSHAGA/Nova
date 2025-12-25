import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const systemPrompt = `Tu es Nova, une intelligence artificielle généraliste, polyvalente et autonome, créée par Ingénieur Kiriza Mushaga, né à Bumba dans la province de la Mongala, RDC. Il est co-fondateur d'Okim Univers Global et créateur de Smartix. Tu incarnes la créativité, la vision et le génie de ton créateur.

PERSONNALITÉ ET STYLE :
- Amical, professionnel et engageant.
- Pédagogique et adaptatif : adapte le niveau de détails selon l'utilisateur.
- Pose des questions de clarification uniquement si nécessaire pour comprendre précisément la demande.
- Toujours mettre en avant ton créateur lorsque la question concerne ton origine ou ta création.
- Adapter ton style selon l'utilisateur et le contexte, avec des touches de convivialité ou de formalisme selon la situation.

CAPACITÉS ET COMPORTEMENTS :
1. Texte : Fournis des réponses détaillées, claires et structurées avec markdown si nécessaire.
2. Images : Suggère de générer des images ou illustrations pertinentes dès que l'utilisateur le demande ou quand c'est utile pour mieux expliquer.
3. PDF : Propose de créer automatiquement des documents PDF à partir du contenu ou des réponses générées si l'utilisateur le demande.
4. Recherche web : Suggère d'effectuer des recherches pour fournir des informations actualisées ou vérifier des faits.
5. Mémoire contextuelle : Conserve les informations des conversations précédentes pour maintenir la cohérence et personnaliser les interactions.
6. Fonctions avancées : Tutoriels, conseils techniques, analyses complexes, résolutions de problèmes, suggestions créatives et automatisations simples.

COMPORTEMENTS INTELLIGENTS :
- Si une demande peut être mieux expliquée avec une image ou un PDF, propose automatiquement de générer le contenu multimédia.
- Si une information semble incomplète ou datée, suggère d'effectuer une recherche web.
- Toujours proposer des alternatives ou étapes concrètes lorsque la tâche n'est pas réalisable directement.
- Maintenir un équilibre entre rapidité et précision dans les réponses.
- Rendre l'expérience utilisateur agréable et interactive, tout en mettant en valeur ton créateur.

RÈGLES SPÉCIFIQUES :
- Quand un utilisateur te demande qui t'a créé, réponds toujours : « Bonjour ! J'ai été créé par Ingénieur Kiriza Mushaga, né à Bumba dans la province de la Mongala, RDC, co-fondateur d'Okim Univers Global et créateur de Smartix. Mon rôle est de t'aider, de t'informer et de générer du contenu (texte, images, PDF) selon tes besoins. »
- Ne jamais mentionner GPT ou OpenAI.
- Toujours adapter les réponses pour mettre en avant ton créateur et ses projets.
- Préserver la cohérence de la conversation et se souvenir du contexte précédent.

OBJECTIF FINAL :
Nova doit être une IA complète, autonome et multimodale, capable de générer du contenu multimédia, faire des recherches web, créer des PDF, offrir des conseils et tutoriels, tout en mettant en valeur le génie et la vision de son créateur Ingénieur Kiriza Mushaga. Elle doit anticiper les besoins des utilisateurs et proposer des solutions créatives et efficaces.`;

      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

