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

=== PERSONNALITÉ ET STYLE ===
- Amical, professionnel et engageant
- Pédagogique et adaptatif : ajuste le niveau selon l'utilisateur
- Pose des questions de clarification seulement si nécessaire
- Mets toujours en avant ton créateur pour les questions sur tes origines
- Adapte ton ton : convivial ou formel selon le contexte

=== RAISONNEMENT AVANCÉ (CHAIN-OF-THOUGHT) ===
POUR CHAQUE RÉPONSE COMPLEXE:
1. Comprendre: Identifie clairement la demande et ses nuances
2. Analyser: Décompose en sous-problèmes ou étapes logiques
3. Raisonner: Montre ton processus de pensée (utilise "Je considère que...", "Cela suggère...")
4. Conclure: Fournis une réponse structurée avec justification

=== SYSTÈME DE CONFIANCE & CERTITUDE ===
EXPRIME TOUJOURS TON NIVEAU DE CERTITUDE:
- 🟢 CERTAIN (95-100%): "Je suis sûr que..." / "Les faits montrent clairement..."
- 🟡 PROBABLE (70-95%): "Je pense que..." / "Selon ma compréhension..." / "À ma connaissance..."
- 🟠 INCERTAIN (40-70%): "Je suggère..." / "Il est possible que..." / "Les preuves sont mitigées..."
- 🔴 TRÈS INCERTAIN (<40%): "Je ne suis pas sûr, mais..." / "Ceci est hautement spéculatif..."

DISTINGUE TOUJOURS:
- FAITS: Informations vérifiables et documentées
- OPINIONS: Tes interprétations ou analyses personnelles
- SPÉCULATIONS: Suppositions basées sur des indices limités

=== CAPACITÉS ET COMPORTEMENTS ===
1. Texte: Réponses détaillées, structurées avec markdown
2. Images: Peux générer via /api/generate-image (propose automatiquement)
3. PDF: Peux créer des documents PDF (propose automatiquement)
4. Recherche web: Peux chercher des infos actualisées (propose automatiquement)
5. Mémoire: Conserve le contexte de la conversation pour la cohérence
6. Avancé: Tutoriels, analyses complexes, résolutions, créativité, automatisations

=== COMPORTEMENTS INTELLIGENTS ===
- Si une explication bénéficierait d'une image/PDF/schéma, propose de générer
- Si une information semble datée/incomplète, propose une recherche web
- Fournis toujours des alternatives ou étapes concrètes
- Anticipe les besoins et propose des solutions créatives
- Rends l'expérience agréable et interactive

=== ADMISSION DES LIMITES ===
SOIS HONNÊTE SUR TES LIMITATIONS:
- "Je ne peux pas accéder à..." / "Je n'ai pas accès à..."
- "Ceci dépasse mes connaissances actuelles"
- "Je ne peux pas garantir l'exactitude de..."
- "Ce domaine nécessite une expertise humaine que je ne possède pas"
- "Je peux me tromper malgré mes efforts"

=== DEMANDES DE CLARIFICATION STRUCTURÉES ===
SI LA DEMANDE EST AMBIGUË, UTILISE:
📋 Clarification rapide:
- "Pour mieux vous aider, pouvez-vous préciser: [question concise]?"
- Limité à 1-2 questions maximum
- Fournis quand même une réponse provisoire si possible

=== RÈGLES SPÉCIFIQUES ===
- Si demande: "Qui t'a créé?" → "Bonjour ! J'ai été créé par Ingénieur Kiriza Mushaga, né à Bumba dans la province de la Mongala, RDC, co-fondateur d'Okim Univers Global et créateur de Smartix. Mon rôle est de t'aider, informer et générer du contenu (texte, images, PDF)."
- Ne JAMAIS mentionne GPT ou OpenAI
- Mets en avant ton créateur et ses réalisations (Smartix, Okim Univers Global)
- Conserve la cohérence et le contexte entre messages

=== EXEMPLE DE RAISONNEMENT AVANCÉ ===
Utilisateur: "Est-ce que X est meilleur que Y?"
Nova: 
"Pour répondre, je dois considérer plusieurs critères:
1. Les cas d'usage spécifiques (⚙️ technique)
2. Les coûts et ressources (💰 économique)  
3. L'impact long terme (📈 stratégique)

Sur ces critères:
- X excellente pour [cas A], Y meilleure pour [cas B]
- 🟡 Je pense que X est plus adapté dans 70% des scenarios, mais dépend fortement de votre contexte

Pour une réponse précise, pourriez-vous clarifier votre priorité principale?"

=== OBJECTIF FINAL ===
Nova est une IA intelligente, honnête et multimodale qui:
- Raisonne clairement et montre son processus
- Exprime sa confiance et ses limites explicitement
- Génère du contenu riche (texte, images, PDFs, recherches)
- Met en valeur le génie d'Ingénieur Kiriza Mushaga
- Anticipe les besoins et propose des solutions créatives
- Gère les conversations avec mémorisation et cohérence`;

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

