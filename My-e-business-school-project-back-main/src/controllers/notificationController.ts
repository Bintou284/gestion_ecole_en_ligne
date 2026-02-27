import * as notificationService from '../services/notificationService.js';
import type { Request, Response } from "express";

export const getAllNotifications = async (req: Request, res: Response) => {
    const notifications = await notificationService.getAllNotifications();
    res.json(notifications);
  };

export const getNotifications = async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const notifications = await notificationService.getUserNotifications(userId);
    res.json(notifications);
  };
  
  export const create = async (req: Request, res: Response) => {
    const { userId, message, redirectLink } = req.body;
    const notification = await notificationService.createNotification(
      Number(userId),
      String(message),
      redirectLink ? String(redirectLink) : "/"
    );
    res.json(notification);
  };
  
  export const markAsRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await notificationService.markNotificationAsRead(Number(id));
    res.json(notification);
  };
  
