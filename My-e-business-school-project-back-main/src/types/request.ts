import type { Request } from "express";
import type { UserDTO } from "./user.js";

export type AuthRequest = Request & {
  user?: UserDTO;
  file?: Express.Multer.File | undefined;
};
