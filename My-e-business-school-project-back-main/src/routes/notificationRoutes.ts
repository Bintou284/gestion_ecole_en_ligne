import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();


router.get('/', notificationController.getAllNotifications);
router.get('/:userId', notificationController.getNotifications);
router.post('/', notificationController.create);
router.patch('/:id/read', notificationController.markAsRead);

export default router;