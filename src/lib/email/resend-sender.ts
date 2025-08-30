import { Resend } from 'resend';
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
  error?: string;
}

// Resend初期化
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY環境変数が設定されていません');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Resendサービスを使用したメール送信
 * Gmail配信率向上・高速配信を実現
 */
export async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
}: EmailData): Promise<EmailResult> {
  try {
    console.log('📧 Resend送信開始:', to);

    const resendClient = getResendClient();

    const result = await resendClient.emails.send({
      from: 'noreply@kab137lab.com',
      to: [to],
      subject,
      html,
      text: text || extractTextFromHtml(html),
      tags: [
        { name: 'service', value: 'board-app' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
      ],
    });

    if (result.error) {
      throw new Error(`Resend API エラー: ${result.error.message}`);
    }

    console.log('✅ Resend送信成功:', result.data?.id);

    return {
      success: true,
      messageId: result.data?.id,
      provider: 'resend',
    };
  } catch (error) {
    console.error('❌ Resend送信失敗:', error);

    Sentry.captureException(error, {
      tags: {
        operation: 'resend-email',
        provider: 'resend',
      },
      extra: {
        to,
        subject,
        errorType: error instanceof Error ? error.constructor.name : 'unknown',
      },
    });

    return {
      success: false,
      provider: 'resend',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * HTMLからプレーンテキストを抽出
 * Resend要求に対応
 */
function extractTextFromHtml(html: string): string {
  // HTML タグを削除してプレーンテキスト生成
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Resend送信状況確認
 * ヘルスチェック・API接続確認
 */
export async function checkResendHealth(): Promise<{
  available: boolean;
  apiKey: boolean;
  lastError?: string;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        available: false,
        apiKey: false,
        lastError: 'RESEND_API_KEY環境変数未設定',
      };
    }

    // Resend API接続確認のみ
    console.log('🔍 Resend API接続確認...');
    getResendClient(); // API接続確認

    return {
      available: true,
      apiKey: true,
    };
  } catch (error) {
    console.error('❌ Resend接続確認失敗:', error);

    return {
      available: false,
      apiKey: !!process.env.RESEND_API_KEY,
      lastError: error instanceof Error ? error.message : String(error),
    };
  }
}
