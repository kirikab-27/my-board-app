import { render } from '@react-email/render';
import { sendEmail } from './sender'; // 既存のNodemailerベースの送信機能
import { sendEmailHybrid } from './hybrid-sender'; // Issue #40: ハイブリッド送信システム
import WelcomeEmail from '@/emails/templates/WelcomeEmail';
import VerificationEmail from '@/emails/templates/VerificationEmail';
import ResetPasswordEmail from '@/emails/templates/ResetPasswordEmail';
import VerificationCodeEmail from '@/emails/templates/VerificationCodeEmail';
import * as Sentry from '@sentry/nextjs';

/**
 * React Emailテンプレートを使用したメール送信サービス
 */
export class ReactEmailService {
  /**
   * ウェルカムメール送信
   */
  static async sendWelcomeEmail(email: string, name: string) {
    try {
      console.log('📧 Sending welcome email to:', email);

      const emailHtml = await render(WelcomeEmail({ name, email }));

      const result = await sendEmailHybrid({
        to: email,
        subject: `🎉 ようこそ、${name}様！ - ${process.env.APP_NAME || '掲示板システム'}`,
        html: emailHtml,
        text: `ようこそ、${name}様！${process.env.APP_NAME || '掲示板システム'}へのご登録が完了しました。ダッシュボード: ${process.env.APP_URL}/dashboard`,
      });

      if (result.success) {
        console.log('✅ Welcome email sent successfully:', result.messageId);

        // 分析用イベント
        Sentry.addBreadcrumb({
          category: 'email',
          message: 'Welcome email sent',
          level: 'info',
          data: { email, name, messageId: result.messageId },
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);

      Sentry.captureException(error, {
        tags: { operation: 'send-welcome-email' },
        extra: { email, name },
      });

      throw new Error('ウェルカムメールの送信に失敗しました');
    }
  }

  /**
   * メール認証用メール送信
   */
  static async sendVerificationEmail(email: string, name: string, token: string) {
    try {
      console.log('📧 Sending verification email to:', email);

      const emailHtml = await render(VerificationEmail({ name, email, token }));

      const result = await sendEmailHybrid({
        to: email,
        subject: `【重要】アカウント認証のお願い - ${process.env.APP_NAME || '掲示板システム'}`,
        html: emailHtml,
        text: `${name}様、メールアドレスの認証をお願いします。認証URL: ${process.env.APP_URL}/api/auth/verify-email?token=${token}`,
      });

      if (result.success) {
        console.log('✅ Verification email sent successfully:', result.messageId);

        // 分析用イベント
        Sentry.addBreadcrumb({
          category: 'email',
          message: 'Verification email sent',
          level: 'info',
          data: { email, name, messageId: result.messageId },
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);

      Sentry.captureException(error, {
        tags: { operation: 'send-verification-email' },
        extra: { email, name },
      });

      throw new Error('認証メールの送信に失敗しました');
    }
  }

  /**
   * パスワードリセットメール送信
   */
  static async sendPasswordResetEmail(email: string, name: string, token: string) {
    try {
      console.log('📧 Sending password reset email to:', email);

      const emailHtml = await render(ResetPasswordEmail({ name, email, token }));

      const result = await sendEmail({
        to: email,
        subject: `🔑 パスワードリセットのご案内 - ${process.env.APP_NAME || '掲示板システム'}`,
        html: emailHtml,
        text: `${name}様、パスワードリセットのご案内です。リセットURL: ${process.env.APP_URL}/auth/reset-password?token=${token}`,
      });

      if (result.success) {
        console.log('✅ Password reset email sent successfully:', result.messageId);

        // 分析用イベント
        Sentry.addBreadcrumb({
          category: 'email',
          message: 'Password reset email sent',
          level: 'info',
          data: { email, name, messageId: result.messageId },
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);

      Sentry.captureException(error, {
        tags: { operation: 'send-password-reset-email' },
        extra: { email, name },
      });

      throw new Error('パスワードリセットメールの送信に失敗しました');
    }
  }

  /**
   * 検証コードメール送信
   */
  static async sendVerificationCodeEmail(
    email: string,
    code: string,
    type: 'admin_registration' | 'password_reset' | '2fa' | 'email_verification',
    name?: string
  ) {
    try {
      console.log('📧 Sending verification code email to:', email, 'Type:', type);

      const emailHtml = await render(VerificationCodeEmail({ 
        email, 
        code, 
        type, 
        name,
        expiresInMinutes: 10 
      }));

      const getSubject = () => {
        switch (type) {
          case 'admin_registration':
            return '🔐 管理者登録用認証コード';
          case 'password_reset':
            return '🔑 パスワードリセット用認証コード';
          case '2fa':
            return '🛡️ 2段階認証コード';
          case 'email_verification':
            return '✉️ メールアドレス認証コード';
          default:
            return '認証コード';
        }
      };

      const result = await sendEmailHybrid({
        to: email,
        subject: `${getSubject()} - ${process.env.APP_NAME || '掲示板システム'}`,
        html: emailHtml,
        text: `認証コード: ${code}\n\nこのコードは10分間有効です。`,
      });

      if (result.success) {
        console.log('✅ Verification code email sent successfully:', result.messageId);

        // 分析用イベント
        Sentry.addBreadcrumb({
          category: 'email',
          message: 'Verification code email sent',
          level: 'info',
          data: { email, type, messageId: result.messageId },
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send verification code email:', error);

      Sentry.captureException(error, {
        tags: { operation: 'send-verification-code-email' },
        extra: { email, type },
      });

      throw new Error('認証コードメールの送信に失敗しました');
    }
  }
}

// 便利な関数エクスポート
export const { 
  sendWelcomeEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendVerificationCodeEmail 
} = ReactEmailService;
