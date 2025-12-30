import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set");
}

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const threadSchema = new mongoose.Schema({
  title: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  threadId: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  plan: { type: String, default: "free" },
  quotaUsed: { type: Number, default: 0 },
});

export const Thread = mongoose.model("Thread", threadSchema);
export const Message = mongoose.model("Message", messageSchema);
export const User = mongoose.model("User", userSchema);
