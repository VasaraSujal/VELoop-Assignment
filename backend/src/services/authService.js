import crypto from 'node:crypto';
import { config } from '../config/env.js';
import UserAccount from '../models/UserAccount.js';

/**
 * Base64 URL encode helper
 */
const base64UrlEncode = (str) => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

/**
 * Base64 URL decode helper
 */
const base64UrlDecode = (str) => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
};

/**
 * Signs a payload creating a standard HS256 JWT
 */
export const signJwt = (payload, secret = config.jwtSecret, expiresInSeconds = 86400) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
};

/**
 * Verifies a standard HS256 JWT
 */
export const verifyJwt = (token, secret = config.jwtSecret) => {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time signature comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
};

/**
 * Authentication Service & Provider Abstraction
 * Isolates user identity resolution. Can be easily swapped for real VELOOP SSO in production.
 */
export class AuthService {
  /**
   * Resolves authoritative user account by userId
   */
  static async getUserById(userId) {
    if (!userId) return null;
    return UserAccount.findOne({ userId }).lean();
  }

  /**
   * Generates a signed JWT session token for a given user
   */
  static generateToken(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      handle: user.handle,
      tier: user.tier,
    };
    return signJwt(payload);
  }

  /**
   * Development Demo Login: authenticates as one of the pre-seeded demo personas
   */
  static async demoLogin(userId) {
    const targetUserId = userId || 'user_alex';
    let user = await UserAccount.findOne({ userId: targetUserId });

    if (!user) {
      throw new Error(`Demo user account '${targetUserId}' not found in database.`);
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(`User account is ${user.status}.`);
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        userId: user.userId,
        email: user.email,
        handle: user.handle,
        name: user.name,
        tier: user.tier,
        isKycVerified: user.isKycVerified,
        balances: user.balances,
        status: user.status,
      },
    };
  }

  /**
   * Lists available development demo accounts (disabled in production)
   */
  static async listDemoUsers() {
    return UserAccount.find({}, 'userId email handle name tier isKycVerified balances status').lean();
  }
}

export default AuthService;
