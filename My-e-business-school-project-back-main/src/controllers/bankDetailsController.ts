import type { Request, Response, NextFunction } from "express";
import type { UserDTO } from "../types/user.js";
import { AppError } from "../utils/AppError.js";
import prisma from "../config/prisma.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { isValidIBAN, isValidBIC, isValidAccountHolder, formatIBAN } from "../utils/bankValidation.js";

interface AuthRequest extends Request {
  user?: UserDTO;
}

/**
 * Met à jour les informations bancaires d'un professeur
 */
export const updateBankDetails = async (
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

    // Vérifier que l'utilisateur est un professeur
    // Note: Le rôle est déjà vérifié par authMiddleware
    const userRole = (req.user as any).role;
    if (userRole !== 'teacher') {
      throw new AppError("Accès réservé aux professeurs", 403);
    }

    const { iban, bic, account_holder } = req.body;

    // Validation des données
    if (iban && !isValidIBAN(iban)) {
      throw new AppError("IBAN invalide", 400);
    }

    if (bic && !isValidBIC(bic)) {
      throw new AppError("BIC invalide", 400);
    }

    if (account_holder && !isValidAccountHolder(account_holder)) {
      throw new AppError("Nom du titulaire invalide", 400);
    }

    // Chiffrer les données bancaires
    const encryptedData: any = {};
    if (iban) {
      const formattedIBAN = formatIBAN(iban);
      encryptedData.iban_encrypted = encrypt(formattedIBAN);
    }
    if (bic) {
      encryptedData.bic_encrypted = encrypt(bic.toUpperCase());
    }
    if (account_holder) {
      encryptedData.account_holder = account_holder.trim();
    }

    encryptedData.bank_details_updated_at = new Date();
    encryptedData.bank_details_updated_by = userId;

    // Vérifier si le profil existe déjà
    const existingProfile = await prisma.teacher_profiles.findUnique({
      where: { teacher_id: userId }
    });

    let profile;
    if (existingProfile) {
      // Mettre à jour
      profile = await prisma.teacher_profiles.update({
        where: { teacher_id: userId },
        data: encryptedData
      });
    } else {
      // Créer
      profile = await prisma.teacher_profiles.create({
        data: {
          teacher_id: userId,
          ...encryptedData
        }
      });
    }

    return res.json({
      success: true,
      message: "Informations bancaires mises à jour avec succès",
      data: {
        has_iban: !!profile.iban_encrypted,
        has_bic: !!profile.bic_encrypted,
        account_holder: profile.account_holder,
        updated_at: profile.bank_details_updated_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Récupère les informations bancaires du professeur connecté
 */
export const getOwnBankDetails = async (
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

    const profile = await prisma.teacher_profiles.findUnique({
      where: { teacher_id: userId }
    });

    if (!profile) {
      return res.json({
        success: true,
        data: {
          iban: null,
          bic: null,
          account_holder: null
        }
      });
    }

    // Déchiffrer les données
    const decryptedData = {
      iban: profile.iban_encrypted ? decrypt(profile.iban_encrypted) : null,
      bic: profile.bic_encrypted ? decrypt(profile.bic_encrypted) : null,
      account_holder: profile.account_holder,
      updated_at: profile.bank_details_updated_at
    };

    return res.json({
      success: true,
      data: decryptedData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Récupère les informations bancaires d'un professeur (pour admin)
 */
export const getTeacherBankDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const currentUserId = (req.user as any).userId || (req.user as any).id;

    if (!currentUserId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    const userRole = (req.user as any).role;
    if (userRole !== 'admin') {
      throw new AppError("Accès réservé aux administrateurs", 403);
    }

    const teacherId = parseInt(req.params.teacherId as string);
    if (isNaN(teacherId)) {
      throw new AppError("ID professeur invalide", 400);
    }

    // Récupérer les infos du professeur
    const teacher = await prisma.users.findUnique({
      where: { user_id: teacherId },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    });

    if (!teacher) {
      throw new AppError("Professeur non trouvé", 404);
    }

    // Récupérer le profil bancaire
    const profile = await prisma.teacher_profiles.findUnique({
      where: { teacher_id: teacherId }
    });

    if (!profile) {
      return res.json({
        success: true,
        data: {
          teacher,
          bank_details: {
            iban: null,
            bic: null,
            account_holder: null
          }
        }
      });
    }

    // Déchiffrer les données
    const decryptedData = {
      iban: profile.iban_encrypted ? decrypt(profile.iban_encrypted) : null,
      bic: profile.bic_encrypted ? decrypt(profile.bic_encrypted) : null,
      account_holder: profile.account_holder,
      updated_at: profile.bank_details_updated_at
    };

    // Logger l'accès dans la table d'audit
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    await prisma.bank_details_access_log.create({
      data: {
        teacher_id: teacherId,
        accessed_by: currentUserId,
        access_type: 'view',
        ip_address: ipAddress
      }
    });

    return res.json({
      success: true,
      data: {
        teacher,
        bank_details: decryptedData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Liste tous les professeurs avec leurs RIB (pour admin - export comptable)
 */
export const getAllTeachersBankDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401);
    }

    const currentUserId = (req.user as any).userId || (req.user as any).id;

    if (!currentUserId) {
      throw new AppError("ID utilisateur manquant", 401);
    }

    const userRole = (req.user as any).role;
    if (userRole !== 'admin') {
      throw new AppError("Accès réservé aux administrateurs", 403);
    }

    // Récupérer tous les professeurs
    const teachers = await prisma.users.findMany({
      where: {
        user_roles: {
          some: {
            roles: {
              role_name: 'teacher'
            }
          }
        }
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        teacher_profiles: {
          select: {
            iban_encrypted: true,
            bic_encrypted: true,
            account_holder: true,
            bank_details_updated_at: true
          }
        }
      }
    });

    // Déchiffrer les données pour chaque professeur
    const result = teachers.map(teacher => {
      const profile = teacher.teacher_profiles;

      return {
        user_id: teacher.user_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        bank_details: profile ? {
          iban: profile.iban_encrypted ? decrypt(profile.iban_encrypted) : null,
          bic: profile.bic_encrypted ? decrypt(profile.bic_encrypted) : null,
          account_holder: profile.account_holder,
          updated_at: profile.bank_details_updated_at
        } : {
          iban: null,
          bic: null,
          account_holder: null,
          updated_at: null
        }
      };
    });

    // Logger l'accès dans la table d'audit
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    for (const teacher of teachers) {
      await prisma.bank_details_access_log.create({
        data: {
          teacher_id: teacher.user_id,
          accessed_by: currentUserId,
          access_type: 'export',
          ip_address: ipAddress
        }
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
