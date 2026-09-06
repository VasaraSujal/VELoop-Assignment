/**
 * Privacy masking helpers for public winner rosters and leaderboards
 */

/**
 * Masks an email address: sujal.dev@gmail.com -> su***@gmail.com
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Anonymous';
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  const visible = localPart.slice(0, 2);
  return `${visible}***@${domain}`;
};

/**
 * Masks a phone number: +91 9876543210 -> +91 98****3210
 */
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '***';
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return '******';
  }
  const firstTwo = digitsOnly.slice(0, 2);
  const lastFour = digitsOnly.slice(-4);
  return `${firstTwo}****${lastFour}`;
};

/**
 * Masks a user or wallet ID: usr_987654321abcd -> usr_98...abcd
 */
export const maskUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    return 'User';
  }
  if (userId.length <= 8) {
    return userId;
  }
  const prefix = userId.slice(0, 4);
  const suffix = userId.slice(-4);
  return `${prefix}...${suffix}`;
};
