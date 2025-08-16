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

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  providers: [
    // メールアドレス・パスワード認証
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // IPアドレス取得
        const ip =
          (req?.headers?.['x-forwarded-for'] as string) ||
          (req?.headers?.['x-real-ip'] as string) ||
          '127.0.0.1';

        const clientIP = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();

        try {
          // バリデーション
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.log('❌ Validation failed:', validatedFields.error.flatten().fieldErrors);
            return null;
          }

          const { email, password } = validatedFields.data;

          // IP制限チェック
          const ipLimit = checkIPRateLimit(clientIP);
          if (!ipLimit.success) {
            console.log(`🚫 IP rate limit exceeded: ${clientIP}`, ipLimit.error);
            throw new Error(ipLimit.error || 'IP制限により一時的にブロックされています。');
          }

          // ユーザー制限チェック
          const userLimit = checkUserRateLimit(email);
          if (!userLimit.success) {
            console.log(`🚫 User rate limit exceeded: ${email}`, userLimit.error);
            throw new Error(userLimit.error || 'アカウントが一時的にブロックされています。');
          }

          // DB接続
          await connectDB();

          // ユーザー検索
          const user = await User.findOne({ email }).select('+password');
          if (!user) {
            console.log('❌ User not found:', email);
            // 失敗記録
            recordFailedAttempt(clientIP, email);
            return null;
          }

          // メール認証確認（一時的に無効化 - 緊急修正）
          // if (!user.emailVerified) {
          //   console.log('❌ Email not verified:', email);
          //   // 未認証は試行回数にカウントしない（正当なユーザーの可能性）
          //   throw new Error(
          //     'メール認証が完了していません。メールに送信された認証リンクをクリックしてください。'
          //   );
          // }

          // パスワード確認
          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            // 失敗記録
            recordFailedAttempt(clientIP, email);
            return null;
          }

          // ログイン成功 - 試行回数リセット
          resetAttempts(clientIP, email);
          console.log('✅ Login successful:', email, `from IP: ${clientIP}`);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || null,
            role: user.role || 'user',
          };
        } catch (error) {
          console.error('❌ Auth error:', error);

          // エラーがレート制限関連でない場合は失敗として記録
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('制限') && !errorMessage.includes('ブロック')) {
            const validatedFields = loginSchema.safeParse(credentials);
            if (validatedFields.success) {
              recordFailedAttempt(clientIP, validatedFields.data.email);
            }
          }

          // レート制限エラーの場合、特別な処理でエラー情報を保持
          if (errorMessage.includes('制限') || errorMessage.includes('ブロック')) {
            // エラーメッセージをNextAuth.js経由で伝達するため、特別な形式でreturn
            throw new Error(`RATE_LIMIT_ERROR:${errorMessage}`);
          }

          return null;
        }
      },
    }),
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
