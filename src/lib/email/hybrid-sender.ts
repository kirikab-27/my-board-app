import { sendEmailWithResend, checkResendHealth } from './resend-sender';
import { sendEmail } from './sender'; // 既存さくらSMTP
import * as Sentry from '@sentry/nextjs';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  fallbackUsed?: boolean;
  error?: string;
}

type EmailProvider = 'resend' | 'sakura' | 'hybrid';

/**
 * ハイブリッドメール送信システム
 * Resend優先・さくらSMTPフォールバック
 * Gmail配信問題解決・信頼性向上
 */
export async function sendEmailHybrid(emailData: EmailData): Promise<EmailResult> {
  const provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'hybrid';

  console.log(`📧 ハイブリッド送信開始: ${emailData.to} (プロバイダー: ${provider})`);

  try {
    // プロバイダー選択ロジック
    switch (provider) {
      case 'resend':
        // Resend単体使用
        return await sendWithResendOnly(emailData);

      case 'sakura':
        // さくらSMTP単体使用
        return await sendWithSakuraOnly(emailData);

      case 'hybrid':
      default:
        // ハイブリッド使用（推奨）
        return await sendWithHybridLogic(emailData);
    }
  } catch (error) {
    console.error('❌ ハイブリッド送信システムエラー:', error);

    Sentry.captureException(error, {
      tags: {
        operation: 'hybrid-email-send',
        provider: provider,
      },
      extra: {
        to: emailData.to,
        subject: emailData.subject,
        emailProvider: provider,
      },
    });

    return {
      success: false,
      provider: 'hybrid-error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resend単体送信
 */
async function sendWithResendOnly(emailData: EmailData): Promise<EmailResult> {
  console.log('📧 Resend単体送信モード');
  return await sendEmailWithResend(emailData);
}

/**
 * さくらSMTP単体送信
 */
async function sendWithSakuraOnly(emailData: EmailData): Promise<EmailResult> {
  console.log('📧 さくらSMTP単体送信モード');

  try {
    const result = await sendEmail(emailData);

    return {
      success: true,
      messageId: result.messageId,
      provider: 'sakura',
    };
  } catch (error) {
    return {
      success: false,
      provider: 'sakura',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * ハイブリッド送信ロジック
 * Resend優先・さくらSMTPフォールバック
 */
async function sendWithHybridLogic(emailData: EmailData): Promise<EmailResult> {
  console.log('📧 ハイブリッド送信モード: Resend優先・さくらSMTPフォールバック');

  // Step 1: Resend送信試行
  try {
    console.log('🚀 Step 1: Resend送信試行...');
    const resendResult = await sendEmailWithResend(emailData);

    if (resendResult.success) {
      console.log('✅ Resend送信成功 - ハイブリッド送信完了');
      return {
        ...resendResult,
        fallbackUsed: false,
      };
    }

    throw new Error(resendResult.error || 'Resend送信失敗');
  } catch (resendError) {
    console.warn('⚠️ Resend送信失敗、さくらSMTPフォールバック実行:', resendError);

    // Step 2: さくらSMTPフォールバック
    try {
      console.log('🔄 Step 2: さくらSMTPフォールバック送信...');
      const sakuraResult = await sendEmail(emailData);

      console.log('✅ さくらSMTPフォールバック送信成功 - ハイブリッド送信完了');

      // フォールバック使用をSentryに記録
      Sentry.addBreadcrumb({
        message: 'Email fallback to Sakura SMTP',
        category: 'email',
        level: 'warning',
        data: {
          resendError: resendError instanceof Error ? resendError.message : String(resendError),
          to: emailData.to,
          subject: emailData.subject,
        },
      });

      return {
        success: true,
        messageId: sakuraResult.messageId,
        provider: 'sakura',
        fallbackUsed: true,
      };
    } catch (sakuraError) {
      console.error('❌ 両方の送信方法が失敗:', { resendError, sakuraError });

      // 両方失敗をSentryに記録
      Sentry.captureException(new Error('Both email providers failed'), {
        tags: {
          operation: 'hybrid-email-total-failure',
        },
        extra: {
          resendError: resendError instanceof Error ? resendError.message : String(resendError),
          sakuraError: sakuraError instanceof Error ? sakuraError.message : String(sakuraError),
          to: emailData.to,
          subject: emailData.subject,
        },
      });

      throw new Error(
        `メール送信サービスが利用できません。Resend: ${resendError instanceof Error ? resendError.message : String(resendError)} / さくらSMTP: ${sakuraError instanceof Error ? sakuraError.message : String(sakuraError)}`
      );
    }
  }
}

/**
 * ハイブリッド送信システム状況確認
 * 両プロバイダーの利用可能性チェック
 */
export async function checkHybridEmailHealth(): Promise<{
  resend: {
    available: boolean;
    apiKey: boolean;
    lastError?: string;
  };
  sakura: {
    available: boolean;
    configured: boolean;
  };
  recommendation: 'resend' | 'sakura' | 'hybrid' | 'unavailable';
}> {
  try {
    // Resend状況確認
    const resendStatus = await checkResendHealth();

    // さくらSMTP状況確認
    const sakuraStatus = {
      available: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      configured: !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD &&
        process.env.MAIL_FROM_ADDRESS
      ),
    };

    // 推奨プロバイダー判定
    let recommendation: 'resend' | 'sakura' | 'hybrid' | 'unavailable';

    if (resendStatus.available && sakuraStatus.available) {
      recommendation = 'hybrid';
    } else if (resendStatus.available) {
      recommendation = 'resend';
    } else if (sakuraStatus.available) {
      recommendation = 'sakura';
    } else {
      recommendation = 'unavailable';
    }

    console.log('📊 ハイブリッド送信システム状況:', {
      resend: resendStatus,
      sakura: sakuraStatus,
      recommendation,
    });

    return {
      resend: resendStatus,
      sakura: sakuraStatus,
      recommendation,
    };
  } catch (error) {
    console.error('❌ ハイブリッド送信システム状況確認エラー:', error);

    return {
      resend: { available: false, apiKey: false, lastError: 'チェック失敗' },
      sakura: { available: false, configured: false },
      recommendation: 'unavailable',
    };
  }
}
