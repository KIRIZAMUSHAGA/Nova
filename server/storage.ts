import { Thread, Message, User } from "./mongodb";
import { type Thread as ThreadType, type Message as MessageType } from "@shared/schema";
import { type User as UserType } from "@shared/auth-schema";

export interface IStorage {
  // Threads
  getThreads(): Promise<ThreadType[]>;
  getThread(id: string): Promise<ThreadType | undefined>;
  createThread(thread: any): Promise<ThreadType>;
  updateThreadTitle(id: string, title: string): Promise<void>;
  
  // Messages
  getMessages(threadId: string): Promise<MessageType[]>;
  createMessage(message: any): Promise<MessageType>;
  
  // Users (Auth)
  createUser(email: string, passwordHash: string): Promise<UserType>;
  createUserWithEmailOrPhone(email: string | null, phone: string | null, passwordHash: string): Promise<UserType>;
  getUserByEmail(email: string): Promise<UserType | null>;
  getUserByPhone(phoneNumber: string): Promise<UserType | null>;
  getUserById(id: string): Promise<UserType | null>;
  
  // Replit Chat Integration compatibility
  getAllConversations(): Promise<any[]>;
  getConversation(id: string): Promise<any>;
  getMessagesByConversation(id: string): Promise<any[]>;
  createMessageInConversation(threadId: string, role: string, content: string): Promise<any>;
  createConversation(title: string): Promise<any>;
  deleteConversation(id: string): Promise<void>;
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

  private mapUser(doc: any): UserType {
    return {
      id: doc._id.toString(),
      email: doc.email,
      createdAt: doc.createdAt,
      plan: doc.plan || "free",
      quotaUsed: doc.quotaUsed || 0,
    };
  }

  async getThreads(): Promise<ThreadType[]> {
    const threads = await Thread.find().sort({ updatedAt: -1 });
    return threads.map(this.mapThread);
  }

  async getThreadsByUserId(userId: string): Promise<ThreadType[]> {
    try {
      const threads = await Thread.find({ userId }).sort({ updatedAt: -1 });
      return threads.map(this.mapThread);
    } catch {
      return [];
    }
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

  // Compatibility methods for Replit Chat Integration
  async getAllConversations() {
    return this.getThreads();
  }
  
  async getConversation(id: string) {
    return this.getThread(id);
  }
  
  async getMessagesByConversation(id: string) {
    const messages = await Message.find({ threadId: id }).sort({ createdAt: 1 });
    return messages.map(m => this.mapMessage(m));
  }

  async createMessageInConversation(threadId: string, role: string, content: string) {
    return this.createMessage({ threadId, role, content });
  }
  
  async createConversation(title: string) {
    return this.createThread({ title });
  }
  
  async deleteConversation(id: string) {
    await Thread.findByIdAndDelete(id);
    await Message.deleteMany({ threadId: id });
  }

  // Auth Methods
  async createUser(email: string, passwordHash: string): Promise<UserType> {
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      plan: "free",
      quotaUsed: 0,
    });
    await user.save();
    return this.mapUser(user);
  }

  async createUserWithEmailOrPhone(
    email: string | null,
    phoneNumber: string | null,
    passwordHash: string
  ): Promise<UserType> {
    const user = new User({
      email: email ? email.toLowerCase() : undefined,
      phoneNumber: phoneNumber || undefined,
      passwordHash,
      createdAt: new Date(),
      plan: "free",
      quotaUsed: 0,
    });
    await user.save();
    return this.mapUser(user);
  }

  async getUserByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user ? this.mapUser(user) : null;
    } catch {
      return null;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ phoneNumber });
      return user ? this.mapUser(user) : null;
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<UserType | null> {
    try {
      const user = await User.findById(id);
      return user ? this.mapUser(user) : null;
    } catch {
      return null;
    }
  }
}

export const storage = new MongoStorage();
