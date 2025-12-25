import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: serial("thread_id").references(() => threads.id),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For extra context or reasoning steps if needed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads);
export const insertMessageSchema = createInsertSchema(messages);

export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
