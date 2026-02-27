import type { Request, Response, NextFunction } from "express";
import { PasswordResetService } from "../services/passwordResetService.js";
import { hashPassword } from "../utils/password.js";
import prisma from "../config/prisma.js";

export const PasswordResetController = {
  /**
   * Demande de réinitialisation de mot de passe
   * POST /api/auth/forgot-password
   */
  async requestReset(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "L'email est requis"
      });
    }

    try {
      // Utiliser le service en mémoire
      await PasswordResetService.requestPasswordReset(email);

      // Réponse générique pour la sécurité (on ne révèle pas si l'email existe)
      res.json({
        message: "Si cet email existe dans notre base, un lien de réinitialisation a été envoyé."
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Réinitialisation du mot de passe avec token
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token et nouveau mot de passe sont requis"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    try {
      // Valider le token avec notre service en mémoire
      const { userId, email } = await PasswordResetService.validateResetToken(token);

      // Hasher le nouveau mot de passe
      const hashedPassword = await hashPassword(password);

      // Mettre à jour le mot de passe dans la base de données
      await prisma.users.update({
        where: { user_id: userId },
        data: { 
          password_hash: hashedPassword,
        }
      });

      // Marquer le token comme utilisé
      await PasswordResetService.markTokenAsUsed(token);

      console.log(`Mot de passe réinitialisé pour l'utilisateur ${userId} (${email})`);

      res.json({
        message: "Mot de passe réinitialisé avec succès"
      });

    } catch (error) {
      next(error);
    }
  },

};