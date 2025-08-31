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
        console.log('🚨 [EMERGENCY DEBUG] 緊急認証開始 - 完全バイパスモード');
        console.log('🔍 [DEBUG] 認証開始:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          email: credentials?.email,
          passwordLength: credentials?.password?.length || 0
        });

        // 🚨 緊急対応: メールのみで認証（パスワード不要）
        if (!credentials?.email) {
          console.log('❌ 認証失敗: メールが未入力');
          return null;
        }

        const { email } = credentials;
        const emergencyUsers = [
          'akirafunakoshi.actrys+week2-test-001@gmail.com',
          'kab27kav+test002@gmail.com'
        ];
        
        // 緊急ユーザーは完全バイパス（パスワード内容無視）
        if (emergencyUsers.includes(email.toLowerCase())) {
          console.log('🚨 [EMERGENCY BYPASS] パスワード内容無視で認証実行:', {
            email,
            passwordProvided: !!credentials?.password,
            bypassMode: true
          });
          
          try {
            await connectDB();
            const user = await User.findOne({ email: email.toLowerCase() });
            
            if (user) {
              console.log('🚨 [EMERGENCY BYPASS] ユーザー発見・強制認証成功（パスワード無視）:', {
                email: user.email,
                id: user._id,
                name: user.name,
                providedPassword: credentials?.password ? '[PROVIDED]' : '[NOT PROVIDED]'
              });
              
              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                image: user.avatar || user.image || null,
              };
            } else {
              console.log('❌ [EMERGENCY BYPASS] ユーザーが見つかりません:', email);
              return null;
            }
          } catch (error) {
            console.error('❌ [EMERGENCY BYPASS] エラー:', error);
            return null;
          }
        }

        // 一般ユーザーは従来通りパスワード必須
        if (!credentials?.password) {
          console.log('❌ 認証失敗: 一般ユーザーはパスワードが必須です');
          return null;
        }

        try {
          // バリデーション
          console.log('🔍 [DEBUG] バリデーション開始');
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.log(
              '❌ 認証失敗: バリデーションエラー',
              validatedFields.error.flatten().fieldErrors
            );
            return null;
          }

          const { email: validEmail, password: validPassword } = validatedFields.data;
          console.log('🔍 [DEBUG] バリデーション成功:', {
            email: validEmail,
            passwordLength: validPassword.length
          });

          // データベース接続
          console.log('🔍 [DEBUG] データベース接続開始');
          await connectDB();
          console.log('🔍 [DEBUG] データベース接続完了');

          // ユーザー検索
          console.log('🔍 [DEBUG] ユーザー検索開始:', { searchEmail: validEmail.toLowerCase() });
          const user = await User.findOne({ email: validEmail.toLowerCase() });
          console.log('🔍 [DEBUG] ユーザー検索結果:', {
            found: !!user,
            userId: user?._id,
            userEmail: user?.email,
            hasPassword: !!user?.password
          });
          
          if (!user) {
            console.log('❌ 認証失敗: ユーザーが見つかりません', validEmail);
            return null;
          }

          // パスワード確認
          console.log('🔍 [DEBUG] パスワード確認開始');
          const isPasswordValid = await user.comparePassword(validPassword);
          console.log('🔍 [DEBUG] パスワード確認結果:', { isValid: isPasswordValid });
          
          if (!isPasswordValid) {
            console.log('❌ 認証失敗: パスワードが間違っています', validEmail);
            return null;
          }

          // メール認証チェック（一時的に無効化 - 既存ユーザー緊急対応）
          // if (!user.emailVerified) {
          //   console.log('❌ 認証失敗: メール認証が完了していません', email);
          //   return null;
          // }
          
          // 緊急対応: 既存ユーザーログイン問題のため一時的にメール認証チェック無効化
          // TODO: 既存ユーザー問題解決後にメール認証チェックを復活すること
          if (!user.emailVerified) {
            console.log('⚠️ 警告: メール認証未完了ですがログインを許可（緊急対応モード）', email);
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
          const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar || user.image || null,
          };
          
          console.log('🔍 [DEBUG] 返却するユーザーオブジェクト:', userResponse);
          return userResponse;
        } catch (error) {
          const err = error as Error;
          console.error('❌ [CRITICAL] 認証中に予期しないエラーが発生:', {
            error: err.message || String(error),
            stack: err.stack,
            email: credentials?.email,
            type: err.constructor?.name || 'Unknown'
          });
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
