import crypto from "crypto";
import { MailService } from "./mailService.js";
import { findUserByEmail } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

interface PasswordResetToken {
  token: string;
  userId: number;
  email: string;
  expiresAt: Date;
  used: boolean;
}

// Map temporaire pour stocker les tokens 
const resetTokensStore = new Map<string, PasswordResetToken>();

export const PasswordResetService = {
  /**
   * Génère un token de réinitialisation et envoie l'email
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Vérifier que l'utilisateur existe
    const user = await findUserByEmail(email);
    if (!user) {
      throw new AppError("Aucun utilisateur trouvé avec cet email", 404);
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Créer l'expiration 
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Stocker en mémoire temporairement
    resetTokensStore.set(resetToken, {
      token: resetToken,
      userId: user.user_id,
      email: user.email,
      expiresAt,
      used: false
    });

    // Envoyer l'email
    await MailService.sendPasswordResetEmail(user.email, resetToken, user.first_name);

    console.log(` Token de reset généré pour ${email}: ${resetToken} (expire à ${expiresAt})`);
  },

  /**
   * Valide un token de réinitialisation
   */
  async validateResetToken(token: string): Promise<{ userId: number; email: string }> {
    const resetData = resetTokensStore.get(token);
    
    if (!resetData) {
      throw new AppError("Token de réinitialisation invalide", 400);
    }

    if (resetData.used) {
      throw new AppError("Ce token a déjà été utilisé", 400);
    }

    if (new Date() > resetData.expiresAt) {
      resetTokensStore.delete(token);
      throw new AppError("Token de réinitialisation expiré", 400);
    }

    return {
      userId: resetData.userId,
      email: resetData.email
    };
  },

  /**
   * Marque un token comme utilisé
   */
  async markTokenAsUsed(token: string): Promise<void> {
    const resetData = resetTokensStore.get(token);
    if (resetData) {
      resetData.used = true;
      resetTokensStore.set(token, resetData);
    }
  },

  /**
   * Nettoie les tokens expirés 
   */
  cleanExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of resetTokensStore.entries()) {
      if (now > data.expiresAt) {
        resetTokensStore.delete(token);
      }
    }
  },

  /**
   * Debug: Affiche tous les tokens en mémoire 
   */
  getStoredTokens(): Map<string, PasswordResetToken> {
    return new Map(resetTokensStore);
  }
};