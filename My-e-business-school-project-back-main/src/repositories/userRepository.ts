// src/repositories/userRepository.ts
import prisma from "../config/prisma.js";

export const findUserByEmail = (email: string) => {
  return prisma.users.findUnique({
    where: { email },
    include: {
      user_roles: { include: { roles: true } },
    },
  });
};

export const findUserById = (id: number) => {
  return prisma.users.findUnique({
    where: { user_id: id },
    include: {
      user_roles: { include: { roles: true } },
    },
  });
};
