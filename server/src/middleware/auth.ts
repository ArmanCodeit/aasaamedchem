import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production-12345";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "SELLER";
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized. Access token is missing." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
  }
}

export function requireRole(role: "ADMIN" | "SELLER") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
       res.status(401).json({ error: "Unauthorized." });
       return;
    }

    if (req.user.role !== role) {
       res.status(403).json({ error: "Forbidden. Insufficient permissions." });
       return;
    }

    next();
  };
}
