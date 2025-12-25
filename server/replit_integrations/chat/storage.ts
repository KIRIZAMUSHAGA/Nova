import { db } from "../../db";
import { threads, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<typeof threads.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof threads.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof threads.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    const [conversation] = await db.select().from(threads).where(eq(threads.id, id));
    return conversation;
  },

  async getAllConversations() {
    return db.select().from(threads).orderBy(desc(threads.createdAt));
  },

  async createConversation(title: string) {
    const [conversation] = await db.insert(threads).values({ title }).returning();
    return conversation;
  },

  async deleteConversation(id: number) {
    await db.delete(messages).where(eq(messages.threadId, id));
    await db.delete(threads).where(eq(threads.id, id));
  },

  async getMessagesByConversation(conversationId: number) {
    return db.select().from(messages).where(eq(messages.threadId, conversationId)).orderBy(messages.createdAt);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const [message] = await db.insert(messages).values({ threadId: conversationId, role, content }).returning();
    return message;
  },
};

