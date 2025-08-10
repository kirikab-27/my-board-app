# Phase 1-2: 認証基盤・メール認証統合 実装手順

> NextAuth.js + 既存メール基盤による堅牢な認証システムの構築

## 🎯 Phase概要

**期間**: 5日間（Phase 1: 3日 + Phase 2: 2日）  
**ブランチ**: `feature/auth-system`  
**前提条件**: Phase 0+0.5完了（テスト・観測基盤）  
**目標**: セキュアな認証システムと既存DKIM基盤を活用したメール認証

## 📋 実装チェックリスト

### Phase 1: 認証基盤構築 (3日)
- [ ] NextAuth.js + MongoDB Adapter設定
- [ ] ユーザー・セッション・アカウントモデル作成
- [ ] Credentials Provider実装
- [ ] パスワードハッシュ化（bcrypt）
- [ ] 基本ログイン/ログアウト機能
- [ ] 認証API + 画面実装
- [ ] セッション管理確認
- [ ] セキュリティテスト実施

### Phase 2: メール認証統合 (2日)  
- [ ] 既存メール基盤統合
- [ ] メール認証トークンモデル作成
- [ ] 認証メールテンプレート作成
- [ ] メール認証フロー実装
- [ ] パスワードリセット機能
- [ ] DKIM署名確認
- [ ] エラーハンドリング強化

## 🚀 実装手順

### Step 1: ブランチ準備

```bash
# Phase 0.5完了ブランチから開始
git checkout feature/monitoring
git pull origin feature/monitoring

# Phase 1ブランチ作成（テスト・監視基盤を継承）
git checkout -b feature/auth-system

# 開始タグ
git tag phase-1-start
```

### Step 2: 必要パッケージインストール

```bash
# NextAuth + MongoDB
npm install next-auth @next-auth/mongodb-adapter

# 認証・暗号化
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# バリデーション・ユーティリティ
npm install zod uuid crypto-js
npm install -D @types/uuid @types/crypto-js

# セキュリティ
npm install @next/csp
```

### Step 3: 環境変数設定

**.env.local**
```bash
# NextAuth設定
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here

# MongoDB（既存）
MONGODB_URI=mongodb://localhost:27017/board-app

# メール設定（既存DKIM基盤）
SMTP_HOST=初期ドメイン名.sakura.ne.jp
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username@初期ドメイン名.sakura.ne.jp
SMTP_PASSWORD="パスワード"
MAIL_FROM_ADDRESS=username@your-domain.com
MAIL_FROM_NAME=掲示板システム

# アプリケーション
APP_URL=http://localhost:3010
APP_NAME=掲示板システム
```

### Step 4: データベースモデル作成

**src/models/User.ts**
```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  emailVerified: Date | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // メソッド
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, '名前は必須です'],
    trim: true,
    maxlength: [50, '名前は50文字以内で入力してください'],
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '有効なメールアドレスを入力してください',
    ],
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上で入力してください'],
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// パスワードハッシュ化（保存前）
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// パスワード比較メソッド
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// メールアドレスのインデックス
UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

**src/models/VerificationToken.ts**
```typescript
import mongoose from 'mongoose';

export interface IVerificationToken extends mongoose.Document {
  identifier: string; // メールアドレス
  token: string;
  expires: Date;
  type: 'email-verification' | 'password-reset';
  createdAt: Date;
}

const VerificationTokenSchema = new mongoose.Schema<IVerificationToken>({
  identifier: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset'],
    required: true,
  },
}, {
  timestamps: true,
});

// 有効期限でのインデックス（自動削除用）
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
VerificationTokenSchema.index({ token: 1 }, { unique: true });

export default mongoose.models.VerificationToken || 
  mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
```

### Step 5: NextAuth設定

**src/lib/auth/config.ts**
```typescript
import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoClient } from 'mongodb';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import { loginSchema } from '@/lib/validations/auth';

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // バリデーション
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.log('❌ Validation failed:', validatedFields.error.flatten().fieldErrors);
            return null;
          }

          const { email, password } = validatedFields.data;

          // DB接続
          await connectDB();

          // ユーザー検索
          const user = await User.findOne({ email }).select('+password');
          if (!user) {
            console.log('❌ User not found:', email);
            return null;
          }

          // メール認証確認
          if (!user.emailVerified) {
            console.log('❌ Email not verified:', email);
            throw new Error('メール認証が完了していません');
          }

          // パスワード確認
          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return null;
          }

          console.log('✅ Login successful:', email);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
```

**src/app/api/auth/[...nextauth]/route.ts**
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Step 6: バリデーションスキーマ

**src/lib/validations/auth.ts**
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください')
    .regex(/^[a-zA-Z0-9あ-ん一-龯\s]+$/, '名前に使用できない文字が含まれています'),
  
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください'),
  
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英数字を含む必要があります'),
  
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  
  password: z.string()
    .min(1, 'パスワードは必須です'),
});

export const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
});

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英数字を含む必要があります'),
  
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type NewPasswordSchema = z.infer<typeof newPasswordSchema>;
```

### Step 7: 認証API実装

**src/app/api/auth/register/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { registerSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email/auth-sender';
import { generateVerificationToken } from '@/lib/auth/tokens';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // バリデーション
    const validatedFields = registerSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

    // DB接続
    await connectDB();

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // ユーザー作成
    const user = new User({
      name,
      email,
      password, // mongooseのpreミドルウェアでハッシュ化される
      emailVerified: null,
    });

    await user.save();

    // メール認証トークン生成
    const token = generateVerificationToken();
    const verificationToken = new VerificationToken({
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間
      type: 'email-verification',
    });

    await verificationToken.save();

    // 認証メール送信（既存DKIM基盤活用）
    try {
      await sendVerificationEmail(email, name, token);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // ユーザー作成は成功させるが、メール送信失敗を記録
      Sentry.captureException(emailError, {
        tags: { operation: 'email-verification' },
        extra: { email, userId: user._id },
      });
    }

    return NextResponse.json({
      message: '登録が完了しました。メールアドレスに送信された認証リンクをクリックしてください。',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました。しばらく待ってから再度お試しください。' },
      { status: 500 }
    );
  }
}
```

**src/app/api/auth/verify-email/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/error?error=missing-token', req.url)
      );
    }

    await connectDB();

    // トークン検証
    const verificationToken = await VerificationToken.findOne({
      token,
      type: 'email-verification',
      expires: { $gt: new Date() }, // 有効期限チェック
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid-token', req.url)
      );
    }

    // ユーザーのメール認証を完了
    const user = await User.findOneAndUpdate(
      { email: verificationToken.identifier },
      { 
        emailVerified: new Date(),
        $unset: { emailVerified: null }, // nullを削除して実際の日付を設定
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/error?error=user-not-found', req.url)
      );
    }

    // 使用済みトークン削除
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    console.log('✅ Email verified for:', user.email);

    // 認証完了ページにリダイレクト
    return NextResponse.redirect(
      new URL('/auth/verified?email=' + encodeURIComponent(user.email), req.url)
    );

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=verification-failed', req.url)
    );
  }
}
```

### Step 8: メール送信機能（既存基盤統合）

**src/lib/email/auth-sender.ts**
```typescript
import { sendEmail } from './sender'; // 既存のメール送信基盤
import * as Sentry from '@sentry/nextjs';

// 認証メールテンプレート
export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #4CAF50;">
        <h2 style="color: #333; margin-top: 0;">🔐 メールアドレス認証</h2>
        
        <p style="color: #666; font-size: 16px;">
          ${name} 様、<br><br>
          <strong>${process.env.APP_NAME || '掲示板システム'}</strong> へのご登録ありがとうございます。
        </p>
        
        <p style="color: #666; font-size: 16px;">
          以下のボタンをクリックして、メールアドレスの認証を完了してください：
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; background: #4CAF50; color: white; 
                    padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                    font-size: 16px; font-weight: bold;">
            メールアドレスを認証する
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px;">
          ボタンが機能しない場合は、以下のURLを直接ブラウザにコピーしてください：<br>
          <a href="${verificationUrl}" style="color: #4CAF50; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            ⚠️ この認証リンクは24時間で期限切れになります。<br>
            もしこのメールに心当たりがない場合は、このメールを無視してください。
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} ${process.env.APP_NAME || '掲示板システム'}
          </p>
        </div>
      </div>
    </div>
  `;

  const textContent = `
${process.env.APP_NAME || '掲示板システム'} - メールアドレス認証

${name} 様

ご登録ありがとうございます。
以下のURLにアクセスして、メールアドレスの認証を完了してください：

${verificationUrl}

※このリンクは24時間で期限切れになります。
※このメールに心当たりがない場合は、無視してください。

${process.env.APP_NAME || '掲示板システム'}
  `;

  try {
    await sendEmail({
      to: email,
      subject: `🔐 【${process.env.APP_NAME || '掲示板システム'}】メールアドレス認証のお願い`,
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Verification email sent successfully to:', email);
    
    // 分析用イベント
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Verification email sent',
      level: 'info',
      data: { email },
    });

  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    
    Sentry.captureException(error, {
      tags: { operation: 'send-verification-email' },
      extra: { email, name },
    });
    
    throw new Error('メール送信に失敗しました');
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #FF9800;">
        <h2 style="color: #333; margin-top: 0;">🔑 パスワードリセット</h2>
        
        <p style="color: #666; font-size: 16px;">
          ${name} 様<br><br>
          パスワードリセットのご要求を受け付けました。
        </p>
        
        <p style="color: #666; font-size: 16px;">
          以下のボタンをクリックして、新しいパスワードを設定してください：
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #FF9800; color: white; 
                    padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                    font-size: 16px; font-weight: bold;">
            パスワードをリセットする
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px;">
          ボタンが機能しない場合は、以下のURLを直接ブラウザにコピーしてください：<br>
          <a href="${resetUrl}" style="color: #FF9800; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            ⚠️ このリセットリンクは1時間で期限切れになります。<br>
            もしこのリクエストに心当たりがない場合は、このメールを無視してください。
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `🔑 【${process.env.APP_NAME || '掲示板システム'}】パスワードリセットのご案内`,
      text: `パスワードリセット用URL: ${resetUrl}`,
      html: htmlContent,
    });

    console.log('✅ Password reset email sent to:', email);

  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    Sentry.captureException(error);
    throw new Error('パスワードリセットメールの送信に失敗しました');
  }
};
```

### Step 9: トークン生成ユーティリティ

**src/lib/auth/tokens.ts**
```typescript
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateJWTToken = (payload: any, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, { expiresIn });
};

export const verifyJWTToken = (token: string): any => {
  return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
};
```

### Step 10: 認証画面実装

**src/app/auth/signin/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Link,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginSchema } from '@/lib/validations/auth';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        // ログイン成功
        const session = await getSession();
        console.log('✅ Login successful:', session);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('ログインに失敗しました。しばらく待ってから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <TextField
                {...register('email')}
                type="email"
                label="メールアドレス"
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                required
              />

              <TextField
                {...register('password')}
                type="password"
                label="パスワード"
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'ログイン'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  アカウントをお持ちでない方は{' '}
                  <Link href="/auth/signup" underline="hover">
                    新規登録
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <Link href="/auth/forgot-password" underline="hover">
                    パスワードを忘れた方はこちら
                  </Link>
                </Typography>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
```

## ✅ 完了確認

### Phase 1完了チェック
```bash
# NextAuth動作確認
npm run dev
# http://localhost:3010/auth/signin でログイン画面表示確認
# テストユーザーでログイン・ログアウト確認

# セッション管理確認
# ブラウザでセッション情報確認

# パスワードハッシュ化確認
# MongoDBでユーザーデータ確認（パスワードがハッシュ化されていること）

# テスト実行
npm run test:unit -- --testPathPattern=auth
```

### Phase 2完了チェック
```bash
# メール認証テスト
# 新規登録 → 認証メール送信 → メール内リンククリック → 認証完了

# DKIM署名確認
node scripts/test-dkim-email.js

# パスワードリセットテスト
# パスワードリセット要求 → リセットメール送信 → リンククリック → 新パスワード設定

# エラーハンドリング確認
# 不正なトークン、期限切れトークンでのアクセス確認
```

## 🎯 Phase 1-2完了条件

**Phase 1完了条件:**
- [ ] ユーザー登録・ログイン・ログアウト動作
- [ ] セッション管理正常動作（30日間維持）
- [ ] パスワードハッシュ化（bcrypt, saltRounds:12）
- [ ] 認証画面・API実装完了
- [ ] バリデーション・エラーハンドリング実装
- [ ] テストカバレッジ90%以上（認証部分）

**Phase 2完了条件:**
- [ ] メール認証フロー完全動作（24時間有効）
- [ ] DKIM署名付きメール送信確認
- [ ] パスワードリセット機能動作（1時間有効）
- [ ] 既存メール基盤との完全統合
- [ ] 認証成功率95%以上
- [ ] エラー時のフォールバック動作確認

## 🔄 次のPhaseへ

```bash
# Phase 1-2完了をコミット
git add .
git commit -m "feat: Phase 1-2 - 認証基盤・メール認証統合完了

Phase 1: 認証基盤構築
- NextAuth.js + MongoDB Adapter設定完了
- ユーザー・セッション・トークンモデル実装
- Credentials Provider実装
- パスワードハッシュ化（bcrypt）実装
- ログイン・ログアウト機能実装

Phase 2: メール認証統合
- 既存DKIM基盤との統合完了
- メール認証フロー実装
- パスワードリセット機能実装
- 認証メールテンプレート作成
- セキュリティ強化・エラーハンドリング

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# developにマージ  
git checkout develop
git merge feature/auth-system

# 完了タグ
git tag phase-1-2-complete

# Phase 3準備
git checkout feature/auth-system
git checkout -b feature/member-posts
```

**Phase 1-2完了により、堅牢な認証システムと既存メール基盤を活用したセキュアな会員制基盤が構築されました！**