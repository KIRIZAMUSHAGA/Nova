import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]+$/, "Invalid phone format").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  data => data.email || data.phoneNumber,
  { message: "Email or phone number is required", path: ["email"] }
);

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.date(),
  plan: z.enum(["free", "pro"]).default("free"),
  quotaUsed: z.number().default(0),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
