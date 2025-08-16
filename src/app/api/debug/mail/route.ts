import { NextResponse } from 'next/server';

export async function GET() {
  // 本番環境のメール関連環境変数確認（セキュリティ配慮）
  const mailEnvCheck = {
    SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT || 'MISSING',
    SMTP_SECURE: process.env.SMTP_SECURE || 'MISSING',
    SMTP_USER: process.env.SMTP_USER || 'MISSING',
    SMTP_PASSWORD_SET: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
    MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || 'MISSING',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'MISSING',
    MAIL_REPLY_TO: process.env.MAIL_REPLY_TO || 'MISSING',

    // 重要: 実際に使用される送信者アドレスを確認
    CALCULATED_FROM:
      process.env.MAIL_FROM_NAME && process.env.MAIL_FROM_ADDRESS
        ? `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`
        : 'CANNOT_CALCULATE',

    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'NO',
    DEPLOYMENT_TIME: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Mail environment check',
    environment: mailEnvCheck,

    // 問題診断
    diagnosis: {
      smtp_user_matches_from_address: process.env.SMTP_USER === process.env.MAIL_FROM_ADDRESS,
      missing_vars: Object.entries(mailEnvCheck)
        .filter(([, value]) => value === 'MISSING')
        .map(([key]) => key),
    },
  });
}
