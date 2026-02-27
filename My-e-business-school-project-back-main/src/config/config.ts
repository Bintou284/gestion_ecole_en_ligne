// src/config/config.ts
import type { SignOptions } from "jsonwebtoken";

interface AppConfig {
  jwt: {
    secret: string;
    expiresIn: Exclude<SignOptions["expiresIn"], undefined>;
  };
  bcrypt: { saltRounds: number };
}

// Vérifier que JWT_SECRET existe et créer une fonction de validation
function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
}

function validateJwtExpiresIn(): Exclude<SignOptions["expiresIn"], undefined> {
  const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
  return expiresIn || "1h";
}

export const config: AppConfig = {
  jwt: {
    secret: validateJwtSecret(),
    expiresIn: validateJwtExpiresIn(),
  },
  bcrypt: { saltRounds: 10 },
};