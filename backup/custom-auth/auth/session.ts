import { NextRequest } from 'next/server';
import { verifyJWTToken, generateJWTToken } from './tokens';
import { connectDB } from '../mongodb';
import User, { IUser } from '../../models/User';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: Date | null;
}

export interface Session {
  user: SessionUser | null;
  expires: Date;
}

export const getSession = async (req: NextRequest): Promise<Session | null> => {
  try {
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = verifyJWTToken(token);
    
    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return null;
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
      },
      expires: new Date(decoded.exp * 1000),
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
};

export const createSession = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };
  
  return generateJWTToken(payload, '30d'); // 30日間有効
};

// Cookieからセッションを取得（クライアント側）
export const getSessionFromCookie = async (): Promise<SessionUser | null> => {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const session = await response.json();
    return session.user || null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};