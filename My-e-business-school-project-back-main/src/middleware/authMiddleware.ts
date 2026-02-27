import type { Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config/config.js";
import { findUserById } from "../repositories/userRepository.js";
import type { UserDTO } from "../types/user.js";
import type { AuthRequest } from "../types/request.js";
import { AppError } from "../utils/AppError.js";

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid Authorization header", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) return next(new AppError("Missing token", 401));

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const userId = decoded?.id as number;

    const dbUser = await findUserById(userId);
    if (!dbUser) return next(new AppError("User not found", 401));

    req.user = {
      id: dbUser.user_id,
      firstname: dbUser.first_name,
      lastname: dbUser.last_name,
      email: dbUser.email,
      role: (dbUser.user_roles?.[0]?.roles.role_name as UserDTO["role"]) || "student",
    };

    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
};

export const authStub = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.user = {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john@doe.com",
    role: "teacher",
  };
  next();
};

export const requireRole = (...roles: UserDTO["role"][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // Vérifie si le rôle de l'utilisateur fait partie de la liste autorisée
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};