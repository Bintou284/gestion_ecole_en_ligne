import crypto from 'crypto';

// Algorithme de chiffrement
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Pour AES, la taille IV est de 16 bytes
const AUTH_TAG_LENGTH = 16;

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 * La clé doit être de 32 bytes (256 bits) pour AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  }

  // La clé doit être exactement 32 bytes (64 caractères hex)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY doit être une chaîne hexadécimale de 64 caractères (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Chiffre une chaîne de caractères avec AES-256-GCM
 * @param text - Texte en clair à chiffrer
 * @returns Texte chiffré au format: iv:authTag:encryptedData (en hexadécimal)
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre une chaîne de caractères chiffrée avec AES-256-GCM
 * @param encryptedText - Texte chiffré au format: iv:authTag:encryptedData
 * @returns Texte en clair déchiffré
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const key = getEncryptionKey();

  // Séparer iv, authTag et données chiffrées
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Format de données chiffrées invalide');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masque partiellement un IBAN pour l'affichage
 * Exemple: FR7612345678901234567890123 → FR76 **** **** **** **** **** 123
 */
export function maskIBAN(iban: string): string {
  if (!iban || iban.length < 8) return '****';

  const cleaned = iban.replace(/\s/g, '');
  const countryCode = cleaned.substring(0, 4);
  const lastDigits = cleaned.substring(cleaned.length - 3);
  const middle = '*'.repeat(20);

  return `${countryCode} ${middle.match(/.{1,4}/g)?.join(' ') || ''} ${lastDigits}`;
}

/**
 * Masque partiellement un BIC pour l'affichage
 * Exemple: BNPAFRPPXXX → BNP****PXXX
 */
export function maskBIC(bic: string): string {
  if (!bic || bic.length < 8) return '****';

  const start = bic.substring(0, 3);
  const end = bic.substring(bic.length - 4);

  return `${start}****${end}`;
}
