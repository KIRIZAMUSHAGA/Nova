import { db } from "../server/db";
import { threads, messages } from "../shared/schema";

async function seed() {
  console.log("Seeding database...");
  
  // Create welcome thread
  const [thread] = await db.insert(threads).values({
    title: "Bienvenue",
  }).returning();

  // Create welcome message
  await db.insert(messages).values({
    threadId: thread.id,
    role: "assistant",
    content: "Bonjour ! Je suis votre IA généraliste. Je suis conçue pour vous assister dans tous les domaines : technique, créatif, éducatif, et bien plus encore.\n\nComment puis-je vous aider aujourd'hui ?",
  });

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
