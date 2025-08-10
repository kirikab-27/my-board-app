const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

/**
 * SPF設定後のメール送信テスト
 * @kab137lab.com ドメインからの送信を確認
 */

async function testSPFEmail() {
  console.log('📧 SPF設定後のメール送信テスト');
  console.log('='.repeat(50));
  
  // 設定確認
  console.log('📋 現在の設定:');
  console.log(`  From: ${process.env.MAIL_FROM_ADDRESS}`);
  console.log(`  SMTP: ${process.env.SMTP_HOST}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log('');

  // SPFレコード確認
  console.log('🔍 SPFレコード検証:');
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const domain = process.env.MAIL_FROM_ADDRESS.split('@')[1];
    const { stdout } = await execPromise(`nslookup -type=txt ${domain} 8.8.8.8`);
    
    if (stdout.includes('v=spf1')) {
      console.log('  ✅ SPFレコード検出済み');
      const spfMatch = stdout.match(/v=spf1[^"]+/);
      if (spfMatch) {
        console.log(`  📝 ${spfMatch[0]}`);
      }
    } else {
      console.log('  ❌ SPFレコードが見つかりません');
    }
  } catch (error) {
    console.log('  ⚠️ SPF確認エラー:', error.message);
  }
  
  console.log('');
  console.log('📤 メール送信テスト開始...');
  console.log('-'.repeat(50));

  // メール送信設定
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD.replace(/^"|"$/g, '')
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 受信先メールアドレス入力
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const testEmail = await new Promise((resolve) => {
    rl.question('📮 テストメールの送信先アドレスを入力: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!testEmail) {
    console.log('❌ メールアドレスが入力されませんでした');
    return;
  }

  // テストメール作成
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: testEmail,
    subject: `SPFテスト - ${new Date().toLocaleString('ja-JP')}`,
    text: `SPF設定テストメール

このメールは、kab137lab.comドメインのSPF設定をテストするために送信されました。

【送信情報】
- Fromドメイン: ${process.env.MAIL_FROM_ADDRESS.split('@')[1]}
- SMTPサーバー: ${process.env.SMTP_HOST}
- 送信日時: ${new Date().toLocaleString('ja-JP')}

【SPF検証方法】
メールヘッダーを確認して、以下のような記載があるか確認してください：
- SPF: PASS
- Authentication-Results: spf=pass

問題がある場合は、迷惑メールフォルダも確認してください。

---
このメールはテスト送信です。`,
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">🔐 SPF設定テストメール</h2>
  
  <p>このメールは、<strong>kab137lab.com</strong>ドメインのSPF設定をテストするために送信されました。</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">📋 送信情報</h3>
    <ul style="list-style: none; padding: 0;">
      <li>✉️ Fromドメイン: <code>${process.env.MAIL_FROM_ADDRESS.split('@')[1]}</code></li>
      <li>🖥️ SMTPサーバー: <code>${process.env.SMTP_HOST}</code></li>
      <li>📅 送信日時: ${new Date().toLocaleString('ja-JP')}</li>
    </ul>
  </div>
  
  <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3;">
    <h3 style="margin-top: 0;">🔍 SPF検証方法</h3>
    <p>メールヘッダーを確認して、以下のような記載があるか確認してください：</p>
    <ul>
      <li><strong>SPF: PASS</strong> ✅</li>
      <li><strong>Authentication-Results: spf=pass</strong> ✅</li>
    </ul>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
    <p>⚠️ 問題がある場合は、迷惑メールフォルダも確認してください。</p>
    <p>このメールはテスト送信です。</p>
  </div>
</div>
`
  };

  // メール送信
  try {
    console.log('');
    console.log('🚀 送信中...');
    const info = await transporter.sendInfo(mailOptions);
    
    console.log('');
    console.log('✅ メール送信成功！');
    console.log('-'.repeat(50));
    console.log('📧 送信詳細:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log('');
    console.log('📌 確認事項:');
    console.log('  1. メールが受信トレイに届いているか確認');
    console.log('  2. 迷惑メールフォルダに入っていないか確認');
    console.log('  3. メールヘッダーでSPF=PASSを確認');
    console.log('');
    console.log('💡 ヒント: GmailやOutlookでは「メッセージのソースを表示」でヘッダー確認可能');
    
  } catch (error) {
    console.error('');
    console.error('❌ 送信エラー:', error.message);
    console.error('');
    console.error('🔧 トラブルシューティング:');
    console.error('  1. .env.localの設定を確認');
    console.error('  2. ネットワーク接続を確認（テザリング推奨）');
    console.error('  3. SPFレコードの反映待ち（最大48時間）');
  }
}

// 実行
testSPFEmail().catch(console.error);