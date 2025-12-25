import { db } from "./db";
import { threads, messages, type Thread, type Message, type InsertThread, type InsertMessage } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createThread(thread: InsertThread): Promise<Thread>;
  getThreads(): Promise<Thread[]>;
  getThread(id: number): Promise<Thread | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(threadId: number): Promise<Message[]>;
  updateThreadTitle(threadId: number, title: string): Promise<Thread>;
}

export class DatabaseStorage implements IStorage {
  async createThread(thread: InsertThread): Promise<Thread> {
    const [newThread] = await db.insert(threads).values(thread).returning();
    return newThread;
  }

  async getThreads(): Promise<Thread[]> {
    return await db.select().from(threads).orderBy(desc(threads.updatedAt));
  }

  async getThread(id: number): Promise<Thread | undefined> {
    const [thread] = await db.select().from(threads).where(eq(threads.id, id));
    return thread;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    // Update thread updated_at
    if (message.threadId) {
      await db.update(threads)
        .set({ updatedAt: new Date() })
        .where(eq(threads.id, message.threadId));
    }
    return newMessage;
  }

  async getMessages(threadId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.id));
  }

  async updateThreadTitle(threadId: number, title: string): Promise<Thread> {
    const [updated] = await db.update(threads)
      .set({ title })
      .where(eq(threads.id, threadId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
