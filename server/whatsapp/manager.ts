import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { storage } from '../storage';

export class WhatsAppManager {
  private static instances: Map<string, any> = new Map();
  // Resolvers pour attendre la génération du QR
  private static qrResolvers: Map<string, { resolve: (value: string) => void; reject: (err: any) => void }> = new Map();

  static async initializeClient(userId: string): Promise<string> {
    // Si le client existe déjà, on le retourne
    if (this.instances.has(userId)) {
      console.log(`WhatsApp client already initialized for user ${userId}`);
      const session = await storage.getWhatsappSession(userId);
      return session?.qrCode || '';
    }

    // Créer une Promise pour attendre le QR
    return new Promise((resolve, reject) => {
      // IIFE asynchrone pour gérer l'initialisation
      (async () => {
        // Stocker les resolvers
        this.qrResolvers.set(userId, { resolve, reject });

        // Timeout de sécurité : 10 secondes
        const timeoutId = setTimeout(() => {
          this.qrResolvers.delete(userId);
          reject(new Error(`QR Code generation timeout for user ${userId}`));
        }, 10000);

        const client = new Client({
          authStrategy: new LocalAuth({ clientId: userId }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-extensions'
            ],
            handleSIGTERM: false,
          }
        });

        client.on('qr', async (qr) => {
          try {
            const qrDataUrl = await qrcode.toDataURL(qr);
            await storage.upsertWhatsappSession({
              userId,
              status: 'qr_ready',
              qrCode: qrDataUrl,
            });
            console.log(`QR Code generated and saved for user ${userId}`);
            
            // Résoudre la Promise dès que le QR est généré et sauvegardé
            clearTimeout(timeoutId);
            const resolver = this.qrResolvers.get(userId);
            if (resolver) {
              this.qrResolvers.delete(userId);
              resolver.resolve(qrDataUrl);
            }
          } catch (err) {
            console.error(`Error saving QR code for user ${userId}:`, err);
            clearTimeout(timeoutId);
            const resolver = this.qrResolvers.get(userId);
            if (resolver) {
              this.qrResolvers.delete(userId);
              resolver.reject(err);
            }
          }
        });

        client.on('ready', async () => {
          await storage.upsertWhatsappSession({
            userId,
            status: 'connected',
            qrCode: null,
          });
          console.log(`WhatsApp client ready for user ${userId}`);
        });

        client.on('disconnected', async (reason) => {
          await storage.upsertWhatsappSession({
            userId,
            status: 'disconnected',
            qrCode: null,
            lastError: reason,
          });
          this.instances.delete(userId);
          console.log(`WhatsApp client disconnected for user ${userId}: ${reason}`);
        });

        client.on('auth_failure', async (msg) => {
          await storage.upsertWhatsappSession({
            userId,
            status: 'disconnected',
            lastError: msg,
          });
          console.log(`WhatsApp auth failure for user ${userId}: ${msg}`);
        });

        client.on('message', async (msg) => {
          const contactId = msg.from;
          const content = msg.body;

          await storage.createWhatsappLog({
            userId,
            contactId,
            direction: 'incoming',
            content,
          });

          if (msg.from.endsWith('@g.us')) return;

          try {
            const { getOpenAI, SYSTEM_PROMPT } = await import('../routes');
            const openai = getOpenAI();
            const history = await storage.getRecentWhatsappHistory(userId, contactId, 6);
            const conversationContext = history.map(log => ({
              role: log.direction === 'incoming' ? 'user' : 'assistant' as "user" | "assistant",
              content: log.content
            }));

            const response = await openai.chat.completions.create({
              model: "gpt-5",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...conversationContext,
                { role: "user", content }
              ],
            });

            const aiResponse = response.choices[0].message.content;

            if (aiResponse) {
              await client.sendMessage(contactId, aiResponse);
              await storage.createWhatsappLog({
                userId,
                contactId,
                direction: 'outgoing',
                content: aiResponse,
                aiResponded: true,
              });
            }
          } catch (error) {
            console.error(`Error processing WhatsApp message for user ${userId}:`, error);
          }
        });

        try {
          await client.initialize();
          this.instances.set(userId, client);
        } catch (error: any) {
          console.error(`Failed to initialize WhatsApp client for ${userId}:`, error);
          clearTimeout(timeoutId);
          const resolver = this.qrResolvers.get(userId);
          if (resolver) {
            this.qrResolvers.delete(userId);
            resolver.reject(error);
          }
          await storage.upsertWhatsappSession({
            userId,
            status: 'disconnected',
            lastError: error.message,
          });
        }
      })();
    });
  }

  static getClient(userId: string) {
    return this.instances.get(userId);
  }

  static async logout(userId: string) {
    const client = this.instances.get(userId);
    if (client) {
      try {
        await client.logout();
        await client.destroy();
        this.instances.delete(userId);
        await storage.upsertWhatsappSession({
          userId,
          status: 'disconnected',
          qrCode: null,
        });
      } catch (error) {
        console.error(`Logout error for user ${userId}:`, error);
      }
    }
  }
}
