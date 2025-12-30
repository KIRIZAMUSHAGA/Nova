import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  attachment: text("attachment"), // URL or path to attached file
  metadata: jsonb("metadata"), // For extra context or reasoning steps if needed
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappSessions = pgTable("whatsapp_sessions", {
  userId: text("user_id").primaryKey(),
  status: text("status").notNull(), // 'disconnected', 'qr_ready', 'connected'
  qrCode: text("qr_code"),
  lastError: text("last_error"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappLogs = pgTable("whatsapp_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  contactId: text("contact_id").notNull(),
  direction: text("direction").notNull(), // 'incoming', 'outgoing'
  content: text("content").notNull(),
  aiResponded: boolean("ai_responded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads);
export const insertMessageSchema = createInsertSchema(messages);
export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessions);
export const insertWhatsappLogSchema = createInsertSchema(whatsappLogs);

export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type WhatsappLog = typeof whatsappLogs.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type InsertWhatsappLog = z.infer<typeof insertWhatsappLogSchema>;
