
// //controllers/activatecontrollers.ts
import type { Request, Response } from "express";
import crypto from "crypto";
import { hashPassword } from "../utils/password.js";
import { validatePassword } from "../utils/validator.js";
import { TokenService } from "../services/tokenService.js";
import prisma from "../config/prisma.js";
import { sendNotificationEvent } from "../services/notificationProducer.js";

export const activateAccount = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Vérifie que les champs sont présents
  if (!token || !newPassword) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  // On hash le token reçu pour le comparer avec celui en base
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.users.findFirst({
    where: { activation_token: tokenHash },
  });

  // Vérifications classiques
  if (!user) return res.status(400).json({ error: "TOKEN_INVALID_OR_EXPIRED" });
  if (user.is_account_active)
    return res.status(400).json({ error: "ALREADY_ACTIVE" });

  const isValid = TokenService.verifyActivationToken(
    token,
    user.activation_token!,
    user.activation_expires_at!
  );
  if (!isValid)
    return res.status(400).json({ error: "TOKEN_INVALID_OR_EXPIRED" });

  // Validation du mot de passe (selon les règles du validator.ts)
  try {
    validatePassword(newPassword);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "PASSWORD_INVALID" });
  }

  // Hash sécurisé du nouveau mot de passe
  const hashedPassword = hashPassword(newPassword);

  // On cherche le profil étudiant associé à cet email pour récupérer la formation
  const studentProfile = await prisma.student_profiles.findFirst({
    where: { email: user.email },
  });

  if (studentProfile && studentProfile.formation_id) {
    // Créer l'inscription dans la table `registrations`
    await prisma.registrations.create({
      data: {
        student_id: user.user_id,
        formation_id: studentProfile.formation_id,
        status: "Inscrit", 
      },
    });
  }

  // Mise à jour de l’utilisateur
  await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      password_hash: hashedPassword,
      is_account_active: true,
      activation_token: null,
      activation_expires_at: null,
    },
  });

  try {
    await sendNotificationEvent({
      userId: user.user_id,
      message: "Votre inscription à la formation a bien été validée ! Bienvenue sur la plateforme.",
      redirectLink: `/etudiant/modules`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || " Notif etudiant active account KO :( " });
  }

  return res.json({
    message: "Compte activé avec succès ! Vous pouvez maintenant vous connecter.",
  });
};


export const activateTeacherAccount = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  // Hash du token reçu pour comparer avec la base
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.users.findFirst({
    where: { activation_token: tokenHash },
  });

  if (!user) return res.status(400).json({ error: "TOKEN_INVALID_OR_EXPIRED" });
  if (user.is_account_active)
    return res.status(400).json({ error: "ALREADY_ACTIVE" });

  const isValid = TokenService.verifyActivationToken(
    token,
    user.activation_token!,
    user.activation_expires_at!
  );

  if (!isValid) return res.status(400).json({ error: "TOKEN_INVALID_OR_EXPIRED" });

  // Vérification du mot de passe selon tes règles
  try {
    validatePassword(newPassword);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "PASSWORD_INVALID" });
  }

  const hashedPassword = hashPassword(newPassword);

  // Activation du compte
  await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      password_hash: hashedPassword,
      is_account_active: true,
      activation_token: null,
      activation_expires_at: null
    },
  });

  return res.json({ message: "Compte activé avec succès ! Vous pouvez maintenant vous connecter." });
};



