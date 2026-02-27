import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateStudentProfile,
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Récupérer le profil
router.get("/", authMiddleware, getProfile);

// Modifier le profil
router.put("/", authMiddleware, updateProfile);

// Changer le mot de passe
router.put("/password", authMiddleware, updatePassword);

// Modifier le profil étudiant
router.put("/student", authMiddleware, updateStudentProfile);

export default router;