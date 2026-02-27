//src/emailController.ts
import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { TokenService } from "../services/tokenService.js";
import { MailService } from "../services/mailService.js";


export const sendActivationEmail = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id!);

  const profile = await prisma.student_profiles.findUnique({
    where: { profile_id: studentId },
  });

  if (!profile) return res.status(404).json({ message: "Profil étudiant introuvable." });
  if (!profile.email) throw new Error("L'email du profil est manquant ou invalide.");

  let user = await prisma.users.findUnique({ where: { email: profile.email } });

  if (!user) {
    const { token, data } = TokenService.generateActivationToken();

    user = await prisma.users.create({
      data: {
        email: profile.email,
        first_name: profile.first_name ?? "Étudiant",
        last_name: profile.last_name ?? "Profil",
        password_hash: "TEMPORARY",
        activation_token: data.hash,
        activation_expires_at: data.expiresAt,
        is_account_active: false,
        user_roles: {
          create: {
            roles: {
              connect: {
                role_name: "student"
              }
            }
          }
        }
      },
      include: {
        user_roles: {
          include: { roles: true }
        }
      }
    });

    await MailService.sendActivationEmail(user.email, token, user.first_name);
    return res.json({ message: "Mail d’activation envoyé avec succès." });

  } else if (!user.is_account_active) {
    const { token, data } = TokenService.generateActivationToken();

    await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        activation_token: data.hash,
        activation_expires_at: data.expiresAt,
        last_resend_at: new Date(),
      },
    });

    await MailService.sendActivationEmail(user.email, token, user.first_name);
    return res.json({ message: "Mail d’activation renvoyé avec succès." });

  } else {
    // Compte déjà actif
    return res.status(400).json({ message: "Un compte actif existe déjà avec cette adresse email." });
  }
};

export const sendInscriptionEmail = async (req: Request, res: Response) => {
  const profileId = parseInt(req.params.id!);

  try {
    //  Récupérer le profil étudiant
    const profile = await prisma.student_profiles.findUnique({
      where: { profile_id: profileId },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profil étudiant introuvable." });
    }
 
    if (!profile.email) {
      return res.status(400).json({ message: "Aucune adresse email associée à ce profil." });
    }

    // Envoyer le mail via le service Nodemailer
    await MailService.sendInscriptionEmail(profile.email, profile.first_name ?? "Étudiant");

    return res.json({ message: "Mail d’inscription envoyé avec succès." });
  } catch (error: any) {
  console.error("[Inscription] Erreur lors de l’envoi du mail :", error.message, error);
  return res.status(500).json({ message: error.message || "Erreur lors de l’envoi du mail." });
}

};


export const sendGroupEmail = async (req: Request, res: Response) => {
  try {
    const { filters, subject, body } = req.body;

    // Appliquer les filtres pour récupérer les bons étudiants
    const profiles = await prisma.student_profiles.findMany({
      where: {
        ...(filters.program && { desired_program: filters.program }),
        ...(filters.city && { city: filters.city }),
        ...(filters.financing_preference && {
          financing_preference: filters.financing_preference,
        }),
      },
    });

    if (profiles.length === 0) {
      return res.status(404).json({ message: "Aucun étudiant trouvé avec ces filtres" });
    }

    // Envoi des mails
    for (const student of profiles) {
      if (student.email) {
        await MailService.sendGenericEmail(student.email, subject, body);
      }
    }

    return res.status(200).json({ sentCount: profiles.length });
  } catch (err: any) {
    console.error("sendGroupEmail error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const sendTeacherActivationEmail = async (req: Request, res: Response) => {
  try {
    const teacherId = parseInt(req.params.id!);

    const teacher = await prisma.users.findUnique({
      where: { user_id: teacherId },
    });

    if (!teacher) return res.status(404).json({ message: "Enseignant introuvable." });

    if (teacher.is_account_active)
      return res.status(400).json({ message: "Le compte est déjà actif." });

    // Génère le token et la date d'expiration au moment de l'envoi du mail
    const { token, data } = TokenService.generateActivationToken();

    await prisma.users.update({
      where: { user_id: teacher.user_id },
      data: {
        activation_token: data.hash,
        activation_expires_at: data.expiresAt,
        last_resend_at: new Date()
      }
    });

    // Envoie le mail
    await MailService.sendTeacherActivationEmail(
      teacher.email,
      token,
      teacher.first_name
    );

    return res.json({ message: "Mail d’activation envoyé avec succès." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};