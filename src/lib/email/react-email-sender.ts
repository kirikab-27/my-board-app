import { render } from '@react-email/render';
import { sendEmail } from './sender'; // 既存のNodemailerベースの送信機能
import WelcomeEmail from '@/emails/templates/WelcomeEmail';
import VerificationEmail from '@/emails/templates/VerificationEmail';
import ResetPasswordEmail from '@/emails/templates/ResetPasswordEmail';
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

      const result = await sendEmail({
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

      const result = await sendEmail({
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
}

// 便利な関数エクスポート
export const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } =
  ReactEmailService;
