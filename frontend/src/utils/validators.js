/**
 * Form validation helpers for physical address and gift card claim workflows
 */

/**
 * Validates Indian 6-digit PIN code
 */
export const isValidPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(String(postalCode).trim());
};

/**
 * Validates 10-digit Indian Mobile Number
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length === 10 && /^[6-9]/.test(cleaned);
};

/**
 * Validates standard email format
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
};

/**
 * Validates non-empty string with minimum length
 */
export const isNonEmptyString = (str, minLength = 1) => {
  return typeof str === 'string' && str.trim().length >= minLength;
};
