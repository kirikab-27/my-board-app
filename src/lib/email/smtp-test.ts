// src/lib/email/smtp-test.ts
import nodemailer from 'nodemailer';
import { emailConfig, validateEmailConfig } from './config';

export async function testSMTPConnection() {
  try {
    console.log('🔧 環境変数の検証中...');
    validateEmailConfig();
    console.log('✅ 環境変数: OK');

    console.log('🔧 SMTP接続の作成中...');
    const transporter = nodemailer.createTransporter(emailConfig.smtp);

    console.log('🔧 SMTP接続テスト中...');
    await transporter.verify();
    console.log('✅ SMTP接続: OK');

    return { success: true, message: 'SMTP接続テスト成功' };
  } catch (error) {
    console.error('❌ SMTP接続テストエラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendTestEmail(recipientEmail: string) {
  try {
    console.log('🔧 テストメール送信中...');
    
    const transporter = nodemailer.createTransporter(emailConfig.smtp);
    
    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
      to: recipientEmail,
      subject: '【テスト】さくらメール接続確認',
      html: `
        <h2>メール送信テスト</h2>
        <p>さくらのメールサーバーからのテスト送信です。</p>
        <ul>
          <li><strong>送信時刻:</strong> ${new Date().toLocaleString('ja-JP')}</li>
          <li><strong>送信元:</strong> ${emailConfig.from.address}</li>
          <li><strong>SMTPサーバー:</strong> ${emailConfig.smtp.host}</li>
        </ul>
        <p>このメールが届いた場合、メール設定は正常に動作しています。</p>
      `,
      text: `
        メール送信テスト
        
        さくらのメールサーバーからのテスト送信です。
        
        送信時刻: ${new Date().toLocaleString('ja-JP')}
        送信元: ${emailConfig.from.address}
        SMTPサーバー: ${emailConfig.smtp.host}
        
        このメールが届いた場合、メール設定は正常に動作しています。
      `,
      replyTo: emailConfig.replyTo
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ テストメール送信成功:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      message: `テストメールを ${recipientEmail} に送信しました` 
    };
  } catch (error) {
    console.error('❌ テストメール送信エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}