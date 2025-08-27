import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// Next.js 15 + NextAuth v4互換性修正
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;