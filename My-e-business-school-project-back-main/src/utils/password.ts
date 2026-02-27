// src/utils/password.ts
import bcrypt from "bcrypt";
import { config } from "../config/config.js";

export const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, config.bcrypt.saltRounds);
};

export const comparePassword = (password: string, hash: string) => {
  return bcrypt.compareSync(password, hash);
};
