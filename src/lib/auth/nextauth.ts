import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoClient } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import type { UserRole } from '@/types/auth';
import { TwoFactorAuthService } from '@/lib/auth/twoFactor';

// MongoDBクライアント設定（OAuth Provider使用時）
let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

// OAuth Providerが設定されている場合のみMongoDB Adapterを初期化
const isOAuthEnabled =
  (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') ||
  (process.env.GITHUB_ID && process.env.GITHUB_ID !== 'your_github_id_here');

if (isOAuthEnabled && process.env.MONGODB_URI) {
  // MongoDB接続プール管理
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
}

export const authOptions: NextAuthOptions = {
  // MongoDB Adapter 設定
  // 注意: Credentials Provider と MongoDB Adapter の併用は制限があるため、
  // OAuth Provider（Google/GitHub）が有効な場合のみ使用
  adapter: isOAuthEnabled && clientPromise ? MongoDBAdapter(clientPromise) : undefined,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 入力検証
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // バリデーション
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { email: validEmail, password: validPassword } = validatedFields.data;

          // データベース接続
          await connectDB();

          // ユーザー検索
          const user = await User.findOne({ email: validEmail.toLowerCase() });

          if (!user) {
            return null;
          }

          // パスワード確認
          const isPasswordValid = await user.comparePassword(validPassword);

          if (!isPasswordValid) {
            return null;
          }

          // メール認証チェック
          if (!user.emailVerified) {
            // メール認証が完了していない場合は認証失敗
            return null;
          }

          // NextAuth用のユーザーオブジェクトを返す
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar || user.image || null,
          };
        } catch (error) {
          console.error('Authentication error:', error);
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
    async jwt({ token, user, trigger, session }) {
      // 2FA検証完了時の更新
      if (trigger === 'update' && session?.twoFactorVerified) {
        token.twoFactorVerified = true;
        // 2FA検証時刻を記録
        token.twoFactorVerifiedAt = new Date().toISOString();
        return token;
      }

      // 新規ログインまたはセッション更新でDB情報を取得
      if (user || trigger === 'update') {
        const userId = user?.id || token.id;

        if (user && user.id) {
          token.id = user.id;
        } else if (!token.id && userId) {
          token.id = userId;
        }

        if (userId) {
          try {
            await connectDB();
            const dbUser = await User.findById(userId);

            if (dbUser) {
              // ID設定
              if (user) {
                token.id = user.id;
              } else if (!token.id) {
                token.id = dbUser._id.toString();
              }

              // 権限情報更新
              token.role = dbUser.role || 'user';
              token.emailVerified = dbUser.emailVerified;
              token.bio = dbUser.bio || '';
              token.avatar = dbUser.avatar || null;

              // 2FA状態チェック（管理者・モデレーターのみ）
              if (['admin', 'moderator'].includes(token.role as string)) {
                const is2FAEnabled = await TwoFactorAuthService.isEnabled(dbUser._id.toString());
                token.requires2FA = is2FAEnabled;
                // 初回ログイン時は2FA未検証状態
                if (user) {
                  token.twoFactorVerified = false;
                }
              }
            } else {
              // ユーザーが見つからない場合のデフォルト設定
              if (user && user.id) {
                token.id = user.id;
              } else if (!token.id) {
                token.id = userId;
              }

              token.role = 'user';
              token.emailVerified = null;
              token.bio = '';
              token.avatar = null;
            }
          } catch (error) {
            console.error('JWT callback error:', error);
            token.role = 'user';
            token.emailVerified = null;
            token.avatar = null;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) || 'user';
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.bio = token.bio as string;
        session.user.image = token.avatar as string | null;
        // 2FA状態をセッションに追加
        (session as any).requires2FA = token.requires2FA || false;
        (session as any).twoFactorVerified = token.twoFactorVerified || false;
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
  debug: false,
};
