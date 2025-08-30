import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoClient } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
// Rate limiting imports removed as they're not used with MongoDB adapter
import type { UserRole } from '@/types/auth';

// MongoDBクライアント設定
let client: MongoClient;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI環境変数が設定されていません');
}

// Edge Runtime compatible - use production settings for stability
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(process.env.MONGODB_URI);
  globalWithMongo._mongoClientPromise = client.connect();
}
const clientPromise = globalWithMongo._mongoClientPromise;

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  providers: [
    // メール・パスワード認証
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ 認証失敗: メールまたはパスワードが未入力');
          return null;
        }

        try {
          // バリデーション
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.log(
              '❌ 認証失敗: バリデーションエラー',
              validatedFields.error.flatten().fieldErrors
            );
            return null;
          }

          const { email, password } = validatedFields.data;

          // データベース接続
          await connectDB();

          // ユーザー検索
          const user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            console.log('❌ 認証失敗: ユーザーが見つかりません', email);
            return null;
          }

          // パスワード確認
          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            console.log('❌ 認証失敗: パスワードが間違っています', email);
            return null;
          }

          // メール認証チェック（必須制御復活）
          if (!user.emailVerified) {
            console.log('❌ 認証失敗: メール認証が完了していません', email);
            return null;
          }

          console.log(
            '✅ 認証成功:',
            email,
            'ユーザーID:',
            user._id,
            'メール認証:',
            user.emailVerified ? '済み' : '未完了'
          );

          // NextAuth用のユーザーオブジェクトを返す
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar || user.image || null,
          };
        } catch (error) {
          console.error('❌ 認証エラー:', error);
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
    async jwt({ token, user, trigger }) {
      // 新規ログインまたはセッション更新でDB情報を取得
      if (user || trigger === 'update') {
        const userId = user?.id || token.id;

        if (userId) {
          try {
            await connectDB();
            const dbUser = await User.findById(userId);
            console.log(
              '🔍 JWT callback - trigger:',
              trigger || 'login',
              'user:',
              user?.email || token.email,
              'dbUser found:',
              !!dbUser,
              'avatar:',
              dbUser?.avatar || 'none'
            );

            if (dbUser) {
              // 初回ログイン時のみIDを設定
              if (user) {
                token.id = user.id;
              }

              token.role = dbUser.role || 'user';
              token.emailVerified = dbUser.emailVerified;
              token.bio = dbUser.bio || '';
              token.avatar = dbUser.avatar || null; // プロフィール画像更新

              console.log('✅ JWT callback - token updated:', {
                trigger: trigger || 'login',
                role: token.role,
                emailVerified: !!token.emailVerified,
                bio: !!token.bio,
                avatar: token.avatar ? 'set' : 'none',
              });
            } else {
              token.role = 'user';
              token.emailVerified = null;
              token.bio = '';
              token.avatar = null;
              console.log('⚠️ JWT callback - user not found in DB, using defaults');
            }
          } catch (error) {
            console.error('❌ JWT callback error:', error);
            token.role = 'user';
            token.emailVerified = null;
            token.avatar = null;
          }
        }
      }

      // 既存のトークンの場合の情報ログ出力
      if (!user && !trigger && token) {
        console.log('🔄 JWT callback - existing token, avatar:', token.avatar ? 'set' : 'none');
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.bio = token.bio as string;
        session.user.image = token.avatar as string | null; // プロフィール画像をsessionに設定
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
  debug: false, // Edge Runtime compatible - disabled for production stability
};
