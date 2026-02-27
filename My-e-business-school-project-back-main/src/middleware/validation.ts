// src/middleware/validation.ts
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validator.js';
import { body, validationResult } from "express-validator";


export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }

    // Validation mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed'
    });
  }
  
};


export const createStudentProfileValidator = [
  // Identifiant de l'étudiant
  body("student_id").optional().isInt().withMessage("student_id doit être un entier"),

  // Dates
  body("desired_start_date").optional().isISO8601().toDate(),
  body("birth_date").optional().isISO8601().toDate(),

  // Booléens
  body("handicap").optional().isBoolean(),
  body("found_apprenticeship").optional().isBoolean(),
  body("prior_online_courses").optional().isBoolean(),
  body("has_computer").optional().isBoolean(),
  body("previous_technical_issues").optional().isBoolean(),
  body("quiet_study_space").optional().isBoolean(),
  body("guarantee_place").optional().isBoolean(),

  // Numériques
  body("self_evaluation_virtual_campus").optional().isInt(),
  body("program_expectation_rating").optional().isInt(),

  // Chaînes de caractères
  body("situation").optional().isString(),
  body("desired_program").optional().isString(),
  body("highest_degree").optional().isString(),
  body("degree_name").optional().isString(),
  body("english_level").optional().isString(),
  body("professional_project").optional().isString(),
  body("five_year_vision").optional().isString(),
  body("desired_jobs").optional().isString(),
  body("interests").optional().isString(),
  body("professional_experience").optional().isString(),
  body("hobbies").optional().isString(),
  body("qualities").optional().isString(),
  body("weaknesses").optional().isString(),
  body("company_type_preference").optional().isString(),
  body("mobility_zone").optional().isString(),
  body("apprenticeship_leads").optional().isString(),
  body("online_experience").optional().isString(),
  body("learning_preference").optional().isString(),
  body("comfort_virtual_campus").optional().isString(),
  body("internet_quality").optional().isString(),
  body("financing_preference").optional().isString(),
  body("resume").optional().isString(),
  body("cv_file_path").optional().isString(),

  // Champs personnels
  body("email").optional().isEmail(),
  body("address").optional().isString(),
  body("birth_place").optional().isString(),
  body("city").optional().isString(),
  body("first_name").optional().isString(),
  body("last_name").optional().isString(),
  body("phone").optional().isString(),
  body("postal_code").optional().isString(),

  // Middleware final de validation
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }
    next();
  },
];
