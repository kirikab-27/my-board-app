import { NextResponse } from 'next/server';

export async function GET() {
  // 本番環境での環境変数確認（セキュリティ上、パスワード等は除く）
  const envCheck = {
    SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT || 'MISSING',
    SMTP_SECURE: process.env.SMTP_SECURE || 'MISSING',
    SMTP_USER: process.env.SMTP_USER || 'MISSING',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
    MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || 'MISSING',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'MISSING',
    APP_URL: process.env.APP_URL || 'MISSING',
    APP_NAME: process.env.APP_NAME || 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
    VERCEL: process.env.VERCEL || 'MISSING',
  };

  // メール送信テスト用の模擬実行
  let emailTestResult = 'NOT_TESTED';
  try {
    // SMTP設定の検証のみ（実際の送信はしない）
    const { emailConfig } = await import('@/lib/email/config');
    emailTestResult = 'CONFIG_LOADED';

    // 設定値の妥当性チェック
    if (!emailConfig.smtp.host || !emailConfig.smtp.auth.user || !emailConfig.smtp.auth.pass) {
      emailTestResult = 'CONFIG_INVALID';
    } else {
      emailTestResult = 'CONFIG_VALID';
    }
  } catch (error) {
    emailTestResult = `CONFIG_ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  return NextResponse.json({
    message: 'Environment check for debugging',
    environment: envCheck,
    emailConfigTest: emailTestResult,
    timestamp: new Date().toISOString(),
  });
}
