import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST() {
  try {
    console.log('🔍 本番環境SMTP接続テスト開始');

    // 環境変数確認
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
      MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
    };

    console.log('📋 環境変数確認:', envCheck);

    // SMTP設定作成
    const transporterConfig = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    console.log('🔧 SMTP設定:', {
      ...transporterConfig,
      auth: { user: transporterConfig.auth.user, pass: '***' },
    });

    // トランスポーター作成
    const transporter = nodemailer.createTransporter(transporterConfig);

    // SMTP接続テスト
    console.log('🔌 SMTP接続テスト中...');
    const verifyResult = await transporter.verify();
    console.log('✅ SMTP接続成功:', verifyResult);

    // テストメール送信
    console.log('📧 テストメール送信中...');
    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: 'test@example.com', // ダミーアドレス
      subject: '本番環境テストメール - ' + new Date().toISOString(),
      html: `
        <h2>本番環境メール送信テスト</h2>
        <p>このメールは本番環境からの送信テストです。</p>
        <p>時刻: ${new Date().toLocaleString('ja-JP')}</p>
        <p>環境: Vercel Production</p>
      `,
      text: `本番環境メール送信テスト - ${new Date().toLocaleString('ja-JP')}`,
    };

    const sendResult = await transporter.sendMail(mailOptions);
    console.log('✅ メール送信成功:', sendResult.messageId);

    return NextResponse.json({
      success: true,
      message: '本番環境SMTP接続・メール送信テスト成功',
      environment: envCheck,
      smtp: {
        ...transporterConfig,
        auth: { user: transporterConfig.auth.user, pass: '***' },
      },
      verifyResult,
      sendResult: {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response,
      },
    });
  } catch (error) {
    console.error('❌ 本番環境SMTP接続エラー:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
