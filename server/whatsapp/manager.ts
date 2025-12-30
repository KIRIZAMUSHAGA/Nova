import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { storage } from '../storage';

export class WhatsAppManager {
  private static instances: Map<string, any> = new Map();

  static async initializeClient(userId: string) {
    if (this.instances.has(userId)) {
      return this.instances.get(userId);
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: userId }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        handleSIGTERM: false,
        executablePath: '/usr/bin/google-chrome-stable',
      }
    });

    client.on('qr', async (qr) => {
      const qrDataUrl = await qrcode.toDataURL(qr);
      await storage.upsertWhatsappSession({
        userId,
        status: 'qr_ready',
        qrCode: qrDataUrl,
      });
      console.log(`QR Code generated for user ${userId}`);
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

    try {
      await client.initialize();
      this.instances.set(userId, client);
    } catch (error: any) {
      console.error(`Failed to initialize WhatsApp client for ${userId}:`, error);
      await storage.upsertWhatsappSession({
        userId,
        status: 'disconnected',
        lastError: error.message,
      });
    }

    return client;
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
