import type { Express } from "express";
import { registerChatRoutes } from "./routes";

// Export the registration function
export { registerChatRoutes };

// Using centralized storage from ../../storage
import { storage } from "../../storage";
export const chatStorage = storage;
export type IChatStorage = typeof storage;
