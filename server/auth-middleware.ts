import { Request, Response, NextFunction } from "express";
import { verifyToken, extractTokenFromHeader } from "./auth";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ message: "No authorization token provided" });
      return;
    }

    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ message: "Authentication failed" });
  }
}
