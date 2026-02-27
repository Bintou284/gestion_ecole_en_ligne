import type { Request, Response, NextFunction } from "express";
import { loginUser } from "../services/authService.js";
import { PasswordResetController } from "./passwordResetController.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      error: "Identifier (email or username) and password are required",
    });
  }

  try {
    const { user, token } = await loginUser(identifier, password);
    return res.json({ user, token }); 
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = PasswordResetController.requestReset;
export const resetPassword = PasswordResetController.resetPassword;