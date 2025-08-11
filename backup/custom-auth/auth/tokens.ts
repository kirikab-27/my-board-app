import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateJWTToken = (payload: any, expiresIn: string = '7d'): string => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyJWTToken = (token: string): any => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
};