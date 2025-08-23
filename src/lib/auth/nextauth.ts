import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoClient } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import {
  checkIPRateLimit,
  checkUserRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/security/rateLimit';
import type { UserRole } from '@/types/auth';

// MongoDBクライアント設定
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI環境変数が設定されていません');
}

if (process.env.NODE_ENV === 'development') {
  // 開発環境では既存のクライアントを再利用
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 本番環境では新しいクライアントを作成
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export const authOptions: NextAuthOptions = {
  // アダプターを一時的に無効化してJWTのみで動作
  // adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  providers: [
    // MongoDB接続問題を回避するため、一時的にCredentialsProviderを無効化
    // CredentialsProvider({ ... }),
    // Google OAuth認証（環境変数が設定されている場合のみ）
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here'
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // GitHub OAuth認証（環境変数が設定されている場合のみ）
    ...(process.env.GITHUB_ID &&
    process.env.GITHUB_SECRET &&
    process.env.GITHUB_ID !== 'your_github_id_here'
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        // DBからユーザー情報を取得してroleを設定
        try {
          await connectDB();
          const dbUser = await User.findById(user.id);
          console.log(
            '🔍 JWT callback - user:',
            user.email,
            'dbUser found:',
            !!dbUser,
            'role:',
            dbUser?.role
          );

          if (dbUser) {
            token.role = dbUser.role || 'user'; // デフォルトロール
            token.emailVerified = dbUser.emailVerified;
            token.bio = dbUser.bio || ''; // 自己紹介追加
            console.log('✅ JWT callback - token updated:', {
              role: token.role,
              emailVerified: !!token.emailVerified,
              bio: !!token.bio,
            });
          } else {
            token.role = 'user'; // デフォルトロール
            token.emailVerified = null;
            token.bio = ''; // デフォルト自己紹介
            console.log('⚠️ JWT callback - user not found in DB, using defaults');
          }
        } catch (error) {
          console.error('❌ JWT callback error:', error);
          token.role = 'user'; // エラー時はデフォルトロール
          token.emailVerified = null;
        }
      }

      // 既存のトークンの場合もrole情報をログ出力
      if (!user && token) {
        console.log('🔄 JWT callback - existing token role:', token.role);
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.bio = token.bio as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/auth/error',
  },
  theme: {
    colorScheme: 'auto',
    brandColor: '#1976d2', // MUIのプライマリカラー
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
