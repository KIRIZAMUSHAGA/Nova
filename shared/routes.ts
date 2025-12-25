import { z } from "zod";
import { insertMessageSchema, insertThreadSchema } from "./schema";

export const api = {
  threads: {
    create: {
      method: "POST",
      path: "/api/threads",
      input: z.object({}).optional(),
      responses: {
        201: insertThreadSchema,
      },
    },
    list: {
      method: "GET",
      path: "/api/threads",
      responses: {
        200: z.array(insertThreadSchema.extend({ id: z.number() })),
      },
    },
    get: {
      method: "GET",
      path: "/api/threads/:id",
      responses: {
        200: insertThreadSchema.extend({ id: z.number() }),
        404: z.object({ message: z.string() }),
      },
    },
  },
  messages: {
    list: {
      method: "GET",
      path: "/api/threads/:id/messages",
      responses: {
        200: z.array(insertMessageSchema.extend({ id: z.number() })),
      },
    },
    create: {
      method: "POST",
      path: "/api/threads/:id/messages",
      input: z.object({
        content: z.string(),
      }),
      responses: {
        201: insertMessageSchema.extend({ id: z.number() }),
      },
    },
  },
};
