//services/token.service.ts
import crypto from "crypto";

interface ActivationToken {
  hash: string;
  expiresAt: Date;
}

export class TokenService {
  static generateActivationToken(ttlHours: number = 48): { token: string, data: ActivationToken } {
    const token = crypto.randomBytes(32).toString("hex"); // token brut
    const hash = crypto.createHash("sha256").update(token).digest("hex"); // hash pour DB
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    
    return { token, data: { hash, expiresAt } };
  }

  static verifyActivationToken(token: string, hash: string, expiresAt: Date): boolean {
    const calcHash = crypto.createHash("sha256").update(token).digest("hex");
    if (calcHash !== hash) return false;
    if (expiresAt < new Date()) return false;
    return true;
  }
}