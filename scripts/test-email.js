// scripts/test-email.js
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// 環境変数の検証
function validateEmailConfig() {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASSWORD',
    'MAIL_FROM_ADDRESS',
    'MAIL_FROM_NAME'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }

  return true;
}

// SMTP接続テスト
async function testSMTPConnection() {
  try {
    console.log('🔧 環境変数の検証中...');
    validateEmailConfig();
    console.log('✅ 環境変数: OK');

    console.log('🔧 SMTP接続の作成中...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

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

// テストメール送信
async function sendTestEmail(recipientEmail) {
  try {
    console.log('🔧 テストメール送信中...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: recipientEmail,
      subject: '【テスト】さくらメール接続確認',
      html: `
        <h2>メール送信テスト</h2>
        <p>さくらのメールサーバーからのテスト送信です。</p>
        <ul>
          <li><strong>送信時刻:</strong> ${new Date().toLocaleString('ja-JP')}</li>
          <li><strong>送信元:</strong> ${process.env.MAIL_FROM_ADDRESS}</li>
          <li><strong>SMTPサーバー:</strong> ${process.env.SMTP_HOST}</li>
        </ul>
        <p>このメールが届いた場合、メール設定は正常に動作しています。</p>
      `,
      text: `
        メール送信テスト
        
        さくらのメールサーバーからのテスト送信です。
        
        送信時刻: ${new Date().toLocaleString('ja-JP')}
        送信元: ${process.env.MAIL_FROM_ADDRESS}
        SMTPサーバー: ${process.env.SMTP_HOST}
        
        このメールが届いた場合、メール設定は正常に動作しています。
      `,
      replyTo: process.env.MAIL_REPLY_TO
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

async function runEmailTests() {
  console.log('='.repeat(60));
  console.log('📧 さくらメール動作確認テスト');
  console.log('='.repeat(60));

  // 環境変数の表示（パスワードは隠す）
  console.log('\n📋 現在の設定:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '未設定'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '未設定'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '未設定'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***設定済み***' : '未設定'}`);
  console.log(`MAIL_FROM_ADDRESS: ${process.env.MAIL_FROM_ADDRESS || '未設定'}`);

  // SMTP接続テスト
  console.log('\n1️⃣ SMTP接続テスト');
  console.log('-'.repeat(40));
  const connectionResult = await testSMTPConnection();
  
  if (!connectionResult.success) {
    console.log('❌ SMTP接続に失敗しました。設定を確認してください。');
    console.log(`エラー: ${connectionResult.error}`);
    return;
  }

  // テストメール送信
  console.log('\n2️⃣ テストメール送信');
  console.log('-'.repeat(40));
  
  // テスト用メールアドレス（コマンドライン引数または管理者メール）
  const testRecipient = process.argv[2] || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  
  if (!testRecipient) {
    console.log('❌ テスト送信先メールアドレスが設定されていません。');
    console.log('使用方法: node scripts/test-email.js your-email@example.com');
    return;
  }

  console.log(`📤 テスト送信先: ${testRecipient}`);
  const emailResult = await sendTestEmail(testRecipient);
  
  if (emailResult.success) {
    console.log(`✅ ${emailResult.message}`);
    console.log(`Message ID: ${emailResult.messageId}`);
  } else {
    console.log('❌ テストメール送信に失敗しました。');
    console.log(`エラー: ${emailResult.error}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 テスト完了');
  console.log('='.repeat(60));
}

runEmailTests().catch(console.error);