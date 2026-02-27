/**
 * Utilitaires de validation pour les données bancaires (IBAN, BIC)
 */

/**
 * Valide un IBAN (International Bank Account Number)
 * Supporte principalement les IBAN français mais peut valider d'autres pays
 *
 * @param iban - IBAN à valider
 * @returns true si l'IBAN est valide, false sinon
 */
export function isValidIBAN(iban: string): boolean {
  if (!iban) return false;

  // Nettoyer l'IBAN (enlever espaces et mettre en majuscules)
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Vérifier la longueur (27 caractères pour la France)
  // Les IBAN varient entre 15 et 34 caractères selon les pays
  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return false;
  }

  // Vérifier le format : 2 lettres (pays) + 2 chiffres (clé) + caractères alphanumériques
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIBAN)) {
    return false;
  }

  // Validation spécifique pour IBAN français 
  if (cleanIBAN.startsWith('FR')) {
    if (cleanIBAN.length !== 27) {
      return false;
    }
  }

  // Algorithme de validation MOD 97 (norme ISO)
  return validateIBANChecksum(cleanIBAN);
}

/**
 * Valide la somme de contrôle d'un IBAN selon l'algorithme MOD 97
 */
function validateIBANChecksum(iban: string): boolean {
  // Déplacer les 4 premiers caractères à la fin
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  // Remplacer chaque lettre par son équivalent numérique (A=10, B=11, ..., Z=35)
  const numericString = rearranged
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Si c'est une lettre (A-Z)
      if (code >= 65 && code <= 90) {
        return (code - 55).toString(); // A=10, B=11, etc.
      }
      return char;
    })
    .join('');

  // Calculer le modulo 97 sur le grand nombre
  return mod97(numericString) === 1;
}

/**
 * Calcule le modulo 97 d'un très grand nombre (représenté en string)
 * Nécessaire car JavaScript ne peut pas gérer des nombres aussi grands
 */
function mod97(numStr: string): number {
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
  }
  return remainder;
}

/**
 * Valide un BIC/SWIFT (Bank Identifier Code)
 *
 * Format BIC:
 * - 4 lettres (code banque)
 * - 2 lettres (code pays ISO)
 * - 2 lettres/chiffres (code localisation)
 * - 3 lettres/chiffres optionnels (code succursale)
 *
 * @param bic - BIC à valider
 * @returns true si le BIC est valide, false sinon
 */
export function isValidBIC(bic: string): boolean {
  if (!bic) return false;

  // Nettoyer le BIC (enlever espaces et mettre en majuscules)
  const cleanBIC = bic.replace(/\s/g, '').toUpperCase();

  // Le BIC doit faire 8 ou 11 caractères
  if (cleanBIC.length !== 8 && cleanBIC.length !== 11) {
    return false;
  }

  // Format: AAAABBCCXXX
  // AAAA = Bank code (4 lettres)
  // BB = Country code (2 lettres)
  // CC = Location code (2 lettres ou chiffres)
  // XXX = Branch code optionnel (3 lettres ou chiffres)
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

  return bicRegex.test(cleanBIC);
}

/**
 * Formate un IBAN pour l'affichage (ajoute des espaces tous les 4 caractères)
 * Exemple: FR7612345678901234567890123 → FR76 1234 5678 9012 3456 7890 123
 */
export function formatIBAN(iban: string): string {
  if (!iban) return '';

  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Ajouter un espace tous les 4 caractères
  return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
}

/**
 * Vérifie si un titulaire de compte est valide
 */
export function isValidAccountHolder(name: string): boolean {
  if (!name || name.trim().length < 2) return false;

  // Le nom doit contenr au moins 2 caractères et pas de caractères spéciaux dangereux
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return nameRegex.test(name.trim());
}
