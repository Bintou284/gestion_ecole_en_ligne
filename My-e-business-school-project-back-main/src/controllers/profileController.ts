import type { Request, Response, NextFunction } from "express";
import type { UserDTO } from "../types/user.js";
import { AppError } from "../utils/AppError.js";
import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";

interface AuthRequest extends Request {
  user?: UserDTO;
}

/**
 * Récupère le profil de l'utilisateur avec des infos adaptées selon son rôle
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const userId = (req.user as any).userId || (req.user as any).id;
    
    if (!userId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    // Récupérer l'utilisateur avec ses rôles
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        user_roles: {
          include: { roles: true }
        }
      }
    });

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    // Extraire les rôles
    const roles = user.user_roles.map(ur => ur.roles.role_name);

    // Données de base 
    const baseProfile: any = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      postal_code: user.postal_code,
      city: user.city,
      birth_date: user.birth_date,
      birth_place: user.birth_place,
      created_at: user.created_at,
      is_account_active: user.is_account_active,
      roles: roles
    };

    return res.json({ 
      success: true, 
      data: baseProfile 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour le profil
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const userId = (req.user as any).userId || (req.user as any).id;
    
    if (!userId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    const { first_name, last_name, email, phone, address, postal_code, city } = req.body;

    const updated = await prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(first_name && { first_name }),
        ...(last_name && { last_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(postal_code !== undefined && { postal_code }),
        ...(city !== undefined && { city }),
      },
    });

    return res.json({
      success: true,
      message: "Profil mis à jour",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Change le mot de passe
 */
export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const userId = (req.user as any).userId || (req.user as any).id;
    
    if (!userId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    const { current_password, new_password } = req.body;

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    const isValid = comparePassword(current_password, user!.password_hash);
    if (!isValid) {
      throw new AppError("Mot de passe incorrect", 401);
    }

    const hashed = hashPassword(new_password);
    await prisma.users.update({
      where: { user_id: userId },
      data: { password_hash: hashed },
    });

    return res.json({
      success: true,
      message: "Mot de passe mis à jour",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour le profil étudiant
 */
export const updateStudentProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const userId = (req.user as any).userId || (req.user as any).id;
    
    if (!userId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    const existing = await prisma.student_profiles.findFirst({
      where: { student_id: userId },
    });

    const data = { ...req.body, student_id: userId };

    const profile = existing
      ? await prisma.student_profiles.update({
          where: { profile_id: existing.profile_id },
          data,
        })
      : await prisma.student_profiles.create({ data });

    return res.json({
      success: true,
      message: "Profil étudiant mis à jour",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};