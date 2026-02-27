import { Router } from 'express';
import { login, forgotPassword, resetPassword} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getProfile } from '../controllers/profileController.js';

const router = Router();

router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

//Routes de réinitialisation de mot de passe
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
