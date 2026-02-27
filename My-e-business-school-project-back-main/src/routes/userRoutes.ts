import express from "express";
import { getUserById, getStudentGrades } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Routes pour les utilisateurs
 */

// Récupérer les infos d'un utilisateur par son ID
router.get("/:userId", authMiddleware, getUserById);


export default router;