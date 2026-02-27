import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createNotification = async (userId: number, message: string, redirectLink: string) => {
  return prisma.notification.create({
    data: {
      userId,
      message,
      read: false,
      redirectLink, 
    },
  });
};

export const getUserNotifications = async (userId: number) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const markNotificationAsRead = async (id: number) => {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
};

export const getAllNotifications = async () => {
    return prisma.notification.findMany();
  };
  
export const deleteNotification = async (id: number) => {
    return prisma.notification.delete({
      where: { id },
    });
  }