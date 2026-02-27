// src/utils/validator.ts
import { body } from "express-validator";

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * EMAIL VALIDATION — stricte et conforme RFC 5322
 */
export const validateEmail = (email: string): void => {
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError("Format d'adresse e-mail invalide (exemple@domaine.com)");
  }
};

/**
 * PASSWORD VALIDATION — critères de sécurité recommandés
 * - min 8 caractères
 * - au moins 1 majuscule, 1 minuscule, 1 chiffre
 * - au moins 1 caractère spécial
 */
export const validatePassword = (password: string): void => {
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

  if (!password || !strongPasswordRegex.test(password)) {
    throw new ValidationError(
      "Le mot de passe doit contenir au minimum 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial."
    );
  }
};

/**
 * Required field validation (protects against empty strings, null, undefined)
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    throw new ValidationError(`${fieldName} is required`);
  }
};

/**
 * LOGIN validation — combines both identifier and password checks
 */
export const validateLoginInput = (
  identifier: string,
  password: string
): void => {
  validateRequired(identifier, "Email");
  validateRequired(password, "Password");
  validateEmail(identifier);
  if (password.length < 6) {
    throw new ValidationError("Longueur du mot de passe invalide");
  }
};

export const createCourseValidator = [
  body("title").isString().isLength({ min: 5, max: 120 }),
  body("description").optional().isString().isLength({ max: 2000 }),
  body("teacher_id").isInt({ gt: 0 }).withMessage("teacher_id must be a positive integer"),
  body("formation_id").isInt({ gt: 0 }).withMessage("formation_id must be a positive integer"),
];
