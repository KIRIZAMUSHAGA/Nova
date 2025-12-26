import { Thread, Message } from "./mongodb";
import { type Thread as ThreadType, type Message as MessageType } from "@shared/schema";

export interface IStorage {
  getThreads(): Promise<ThreadType[]>;
  getThread(id: string): Promise<ThreadType | undefined>;
  createThread(thread: any): Promise<ThreadType>;
  updateThreadTitle(id: string, title: string): Promise<void>;
  getMessages(threadId: string): Promise<MessageType[]>;
  createMessage(message: any): Promise<MessageType>;
}

export class MongoStorage implements IStorage {
  private mapThread(doc: any): ThreadType {
    return {
      id: doc._id.toString() as any,
      title: doc.title || null,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  private mapMessage(doc: any): MessageType {
    return {
      id: doc._id.toString() as any,
      threadId: doc.threadId.toString() as any,
      role: doc.role,
      content: doc.content,
      metadata: doc.metadata || null,
      createdAt: doc.createdAt || new Date(),
    };
  }

  async getThreads(): Promise<ThreadType[]> {
    const threads = await Thread.find().sort({ updatedAt: -1 });
    return threads.map(this.mapThread);
  }

  async getThread(id: string): Promise<ThreadType | undefined> {
    try {
      const thread = await Thread.findById(id);
      return thread ? this.mapThread(thread) : undefined;
    } catch {
      return undefined;
    }
  }

  async createThread(insertThread: any): Promise<ThreadType> {
    const thread = new Thread(insertThread);
    await thread.save();
    return this.mapThread(thread);
  }

  async updateThreadTitle(id: string, title: string): Promise<void> {
    await Thread.findByIdAndUpdate(id, { title, updatedAt: new Date() });
  }

  async getMessages(threadId: string): Promise<MessageType[]> {
    const messages = await Message.find({ threadId }).sort({ createdAt: 1 });
    return messages.map(this.mapMessage);
  }

  async createMessage(insertMessage: any): Promise<MessageType> {
    const message = new Message(insertMessage);
    await message.save();
    return this.mapMessage(message);
  }
}

export const storage = new MongoStorage();
