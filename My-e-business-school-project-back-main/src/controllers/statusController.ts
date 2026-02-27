//controller/statusController.ts
import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getAccountStatus = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id!, 10);

  const profile = await prisma.student_profiles.findUnique({
    where: { profile_id: studentId },
  });

  if (!profile) return res.status(404).json({ message: "Profil étudiant introuvable." });

  if (!profile.email) {
  return res.status(400).json({ message: "Le profil n’a pas d’email renseigné." });
}

const user = await prisma.users.findUnique({ where: { email: profile.email } });

  if (!user) {
    return res.json({ status: "pending" }); 
  } else if (user.is_account_active) {
    return res.json({ status: "activated" }); 
  } else {
    return res.json({ status: "sent" }); 
  }
};