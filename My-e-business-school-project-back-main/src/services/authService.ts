import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { findUserByEmail } from "../repositories/userRepository.js";
import { comparePassword } from "../utils/password.js";
import { AppError } from "../utils/AppError.js";
import type { UserDTO } from "../types/user.js";

export const loginUser = async (
  identifier: string,
  password: string
): Promise<{ user: UserDTO; token: string }> => {
  const dbUser = await findUserByEmail(identifier);

  if (!dbUser) throw new AppError("Invalid credentials", 401);

  const isValid = comparePassword(password, dbUser.password_hash || "");
  if (!isValid) throw new AppError("Invalid credentials", 401);

  const user: UserDTO = {
    id: dbUser.user_id,
    firstname: dbUser.first_name,
    lastname: dbUser.last_name,
    email: dbUser.email,
    role: (dbUser.user_roles?.[0]?.roles.role_name as UserDTO["role"]) || "student",
  };

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  return { user, token };
};
