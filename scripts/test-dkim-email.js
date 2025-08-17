const nodemailer = require('nodemailer');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

/**
 * DKIM署名付きメール送信テスト
 * さくらインターネットのDKIM設定をテストします
 */

async function testDKIMEmail() {
  console.log('🔐 DKIM署名付きメール送信テスト');
  console.log('='.repeat(60));
  console.log('');
  
  // 設定確認
  console.log('📋 現在の設定:');
  console.log(`  From: ${process.env.MAIL_FROM_ADDRESS}`);
  console.log(`  SMTP: ${process.env.SMTP_HOST}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log('');

  // DNS設定確認
  console.log('🔍 DNS設定確認中...');
  console.log('-'.repeat(40));
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const domain = process.env.MAIL_FROM_ADDRESS.split('@')[1];
    
    // SPF確認
    try {
      const { stdout: spfResult } = await execPromise(`nslookup -type=txt ${domain} 8.8.8.8`);
      if (spfResult.includes('v=spf1')) {
        console.log('  ✅ SPF レコード: 設定済み');
      } else {
        console.log('  ❌ SPF レコード: 未設定');
      }
    } catch (error) {
      console.log('  ⚠️ SPF確認エラー');
    }

    // DMARC確認  
    try {
      const { stdout: dmarcResult } = await execPromise(`nslookup -type=txt _dmarc.${domain} 8.8.8.8`);
      if (dmarcResult.includes('v=DMARC1')) {
        console.log('  ✅ DMARC レコード: 設定済み');
      } else {
        console.log('  ❌ DMARC レコード: 未設定');
      }
    } catch (error) {
      console.log('  ⚠️ DMARC確認エラー');
    }

    // DKIM確認（セレクタが不明なため一般的なものをチェック）
    const commonSelectors = ['default', 'selector1', 'mail', 'k1', 'dkim'];
    let dkimFound = false;
    
    for (const selector of commonSelectors) {
      try {
        const dkimDomain = `${selector}._domainkey.${domain}`;
        const { stdout: dkimResult } = await execPromise(`nslookup -type=txt ${dkimDomain} 8.8.8.8`);
        
        if (dkimResult.includes('v=DKIM1')) {
          console.log(`  ✅ DKIM レコード: 設定済み (セレクタ: ${selector})`);
          dkimFound = true;
          break;
        }
      } catch (error) {
        // セレクタが見つからない場合は継続
      }
    }
    
    if (!dkimFound) {
      console.log('  ❌ DKIM レコード: 未検出（またはセレクタ不明）');
      console.log('      ヒント: さくらで生成されたセレクタでDNS設定を確認してください');
    }

  } catch (error) {
    console.log('  ⚠️ DNS確認エラー:', error.message);
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const testEmail = await new Promise((resolve) => {
    rl.question('📮 テストメールの送信先アドレス（DKIM確認用）: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!testEmail) {
    console.log('❌ メールアドレスが入力されませんでした');
    return;
  }

  // DKIM テストメール作成
  const currentTime = new Date();
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: testEmail,
    subject: `🔐 DKIM署名テスト - ${currentTime.toLocaleString('ja-JP')}`,
    text: `DKIM署名付きメール送信テスト

このメールは、kab137lab.comドメインのDKIM署名設定をテストするために送信されました。

【送信情報】
- Fromドメイン: ${process.env.MAIL_FROM_ADDRESS.split('@')[1]}
- SMTPサーバー: ${process.env.SMTP_HOST}
- 送信日時: ${currentTime.toLocaleString('ja-JP')}
- テストID: ${Math.random().toString(36).substr(2, 9)}

【DKIM検証方法】
メールヘッダーを確認して、以下の項目をチェックしてください：

1. DKIM-Signature ヘッダーの存在
2. Authentication-Results での dkim=pass 表示
3. 送信元ドメインの検証結果

【詳細確認項目】
• DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/simple; d=kab137lab.com; ...
• Authentication-Results: ... dkim=pass header.d=kab137lab.com ...
• SPF: pass
• DMARC: pass

【推奨確認方法】
1. Gmailの場合：「メッセージのソースを表示」
2. Outlookの場合：「メッセージヘッダーを表示」
3. オンライン確認：Mail Tester (https://www.mail-tester.com)

問題や異常が見つかった場合は、迷惑メールフォルダもご確認ください。

---
このメールはDKIM署名テスト用です。`,
    html: `
<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
  <div style="background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #4CAF50;">
    <h2 style="color: #333; margin-top: 0;">🔐 DKIM署名テストメール</h2>
    
    <p style="color: #666; font-size: 16px;">
      このメールは、<strong style="color: #4CAF50;">kab137lab.com</strong>ドメインのDKIM署名設定をテストするために送信されました。
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h3 style="color: #333; margin-top: 0;">📋 送信情報</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; background: #fff; border: 1px solid #e9ecef; font-weight: bold;">Fromドメイン</td>
          <td style="padding: 8px 12px; background: #fff; border: 1px solid #e9ecef;"><code>${process.env.MAIL_FROM_ADDRESS.split('@')[1]}</code></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">SMTPサーバー</td>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e9ecef;"><code>${process.env.SMTP_HOST}</code></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #fff; border: 1px solid #e9ecef; font-weight: bold;">送信日時</td>
          <td style="padding: 8px 12px; background: #fff; border: 1px solid #e9ecef;">${currentTime.toLocaleString('ja-JP')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">テストID</td>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e9ecef;"><code>${Math.random().toString(36).substr(2, 9)}</code></td>
        </tr>
      </table>
    </div>
    
    <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; border-left: 4px solid #2196F3; margin: 25px 0;">
      <h3 style="color: #1976d2; margin-top: 0;">🔍 DKIM検証方法</h3>
      <p style="margin: 0; color: #333;">メールヘッダーを確認して、以下の項目をチェックしてください：</p>
      <ul style="color: #333; margin: 15px 0;">
        <li><strong>DKIM-Signature</strong> ヘッダーの存在</li>
        <li><strong>Authentication-Results</strong> での <code>dkim=pass</code> 表示</li>
        <li>送信元ドメインの検証結果</li>
      </ul>
    </div>
    
    <div style="background: #f1f8e9; padding: 20px; border-radius: 6px; border-left: 4px solid #8bc34a; margin: 25px 0;">
      <h3 style="color: #558b2f; margin-top: 0;">✅ 期待される認証結果</h3>
      <div style="font-family: monospace; background: #fff; padding: 15px; border-radius: 4px; color: #333; font-size: 14px; line-height: 1.6;">
        <div>• <strong>DKIM-Signature:</strong> v=1; a=rsa-sha256; c=relaxed/simple; d=kab137lab.com; ...</div>
        <div>• <strong>Authentication-Results:</strong> ... dkim=pass header.d=kab137lab.com ...</div>
        <div>• <strong>SPF:</strong> pass</div>
        <div>• <strong>DMARC:</strong> pass</div>
      </div>
    </div>
    
    <div style="background: #fff3e0; padding: 20px; border-radius: 6px; border-left: 4px solid #ff9800; margin: 25px 0;">
      <h3 style="color: #f57c00; margin-top: 0;">🛠️ 推奨確認方法</h3>
      <ol style="color: #333; margin: 0;">
        <li><strong>Gmail</strong>の場合：「メッセージのソースを表示」</li>
        <li><strong>Outlook</strong>の場合：「メッセージヘッダーを表示」</li>
        <li><strong>オンライン確認</strong>：<a href="https://www.mail-tester.com" style="color: #2196F3;">Mail Tester</a></li>
      </ol>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666; font-size: 14px;">
      <p>⚠️ 問題や異常が見つかった場合は、<strong>迷惑メールフォルダ</strong>もご確認ください。</p>
      <p style="margin: 0; font-style: italic;">このメールはDKIM署名テスト用です。</p>
    </div>
  </div>
</div>
`
  };

  // メール送信
  try {
    console.log('');
    console.log('🚀 DKIM署名付きメール送信中...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('');
    console.log('✅ メール送信成功！');
    console.log('='.repeat(60));
    console.log('📧 送信詳細:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log('');
    console.log('🔍 DKIM確認チェックリスト:');
    console.log('  1. ✉️  メールが受信トレイに届いているか');
    console.log('  2. 🚫 迷惑メールフォルダに入っていないか');
    console.log('  3. 🔐 メールヘッダーで "DKIM-Signature" の存在確認');
    console.log('  4. ✅ "Authentication-Results" で "dkim=pass" 確認');
    console.log('  5. 🌟 総合的な認証結果の確認');
    console.log('');
    console.log('💡 ヘッダー確認方法:');
    console.log('  • Gmail: メニュー → "メッセージのソースを表示"');
    console.log('  • Outlook: その他のアクション → "メッセージヘッダーを表示"');
    console.log('  • Yahoo: 詳細 → "ヘッダー情報"');
    console.log('');
    console.log('🌐 オンライン分析ツール:');
    console.log('  • Mail Tester: https://www.mail-tester.com');
    console.log('  • MXToolbox: https://mxtoolbox.com/deliverability');
    
  } catch (error) {
    console.error('');
    console.error('❌ メール送信エラー:', error.message);
    console.error('');
    console.error('🔧 トラブルシューティング:');
    console.error('  1. .env.localの認証情報を確認');
    console.error('  2. ネットワーク接続を確認（テザリング推奨）');
    console.error('  3. さくらインターネットでのDKIM設定完了を確認');
    console.error('  4. CloudflareでのDNS設定完了を確認');
    console.error('  5. DNS反映待ち（最大48時間）');
    console.error('');
    console.error('📞 サポート情報:');
    console.error('  • さくらインターネット: DKIM設定状況の確認');
    console.error('  • Cloudflare: DNS設定の反映状況確認');
  }
}

// 実行
testDKIMEmail().catch(console.error);