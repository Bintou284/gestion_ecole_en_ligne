import { Router } from "express";
import { sendActivationEmail } from "../controllers/emailController.js";
import { sendGroupEmail } from "../controllers/emailController.js";
import { sendInscriptionEmail } from "../controllers/emailController.js";
import { sendTeacherActivationEmail } from "../controllers/emailController.js";


const router = Router();

// Seul un admin peut renvoyer un mail d'activation
router.post("/sendActivation/:id", sendActivationEmail);
router.post("/sendTeacherActivation/:id", sendTeacherActivationEmail);
router.post("/send_group_email", sendGroupEmail);
router.post("/send_inscription_email/:id", sendInscriptionEmail);


export default router;