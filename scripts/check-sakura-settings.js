// scripts/check-sakura-settings.js
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function checkSakuraSettings() {
  console.log('🌸 さくらインターネット メール設定確認');
  console.log('='.repeat(60));
  
  console.log('\n📋 現在の設定値:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? `${process.env.SMTP_PASSWORD.substring(0, 3)}***${process.env.SMTP_PASSWORD.substring(process.env.SMTP_PASSWORD.length-3)}` : '未設定'}`);
  console.log(`パスワード長: ${process.env.SMTP_PASSWORD?.length}文字`);
  
  // さくらのメール設定パターンをテスト
  const sakuraConfigs = [
    {
      name: 'パターン1: 標準的なさくら設定',
      config: {
        host: 'kab137lab.sakura.ne.jp',
        port: 587,
        secure: false,
        auth: {
          user: 'noreply@kab137lab.com',
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'パターン2: ユーザー名を初期ドメイン形式',
      config: {
        host: 'kab137lab.sakura.ne.jp',
        port: 587,
        secure: false,
        auth: {
          user: 'noreply@kab137lab.sakura.ne.jp', // 初期ドメイン使用
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'パターン3: ローカル部分のみ',
      config: {
        host: 'kab137lab.sakura.ne.jp',
        port: 587,
        secure: false,
        auth: {
          user: 'noreply', // @より前のみ
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'パターン4: SSL/TLS (465番ポート)',
      config: {
        host: 'kab137lab.sakura.ne.jp',
        port: 465,
        secure: true,
        auth: {
          user: 'noreply@kab137lab.com',
          pass: process.env.SMTP_PASSWORD
        }
      }
    },
    {
      name: 'パターン5: 一般的なさくら設定（初期ドメイン+SSL）',
      config: {
        host: 'kab137lab.sakura.ne.jp',
        port: 465,
        secure: true,
        auth: {
          user: 'noreply@kab137lab.sakura.ne.jp',
          pass: process.env.SMTP_PASSWORD
        }
      }
    }
  ];

  for (const { name, config } of sakuraConfigs) {
    console.log(`\n🔧 ${name}`);
    console.log(`   ホスト: ${config.host}:${config.port}`);
    console.log(`   認証ユーザー: ${config.auth.user}`);
    console.log(`   暗号化: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      console.log('   接続テスト中...');
      await transporter.verify();
      console.log(`✅ ${name}: 認証成功！`);
      
      // 成功した場合、テストメール送信
      console.log('   📧 テストメール送信中...');
      const info = await transporter.sendMail({
        from: `${process.env.MAIL_FROM_NAME} <${config.auth.user}>`,
        to: process.env.ADMIN_EMAIL || config.auth.user,
        subject: '【成功】さくらメール設定確認',
        text: `${name}での認証に成功しました！\n\n送信時刻: ${new Date().toLocaleString('ja-JP')}\n使用設定: ${JSON.stringify(config, null, 2)}`,
        html: `
          <h2>🎉 認証成功</h2>
          <p><strong>${name}</strong>での認証に成功しました！</p>
          <p>送信時刻: ${new Date().toLocaleString('ja-JP')}</p>
          <h3>使用した設定:</h3>
          <pre>${JSON.stringify(config, null, 2)}</pre>
        `
      });
      
      console.log(`✅ メール送信成功: ${info.messageId}`);
      console.log('\n🎯 この設定を .env.local に反映してください:');
      console.log(`SMTP_HOST=${config.host}`);
      console.log(`SMTP_PORT=${config.port}`);
      console.log(`SMTP_SECURE=${config.secure}`);
      console.log(`SMTP_USER=${config.auth.user}`);
      
      return; // 成功したら終了
      
    } catch (error) {
      console.log(`❌ 失敗: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log('\n\n🔍 すべての設定で認証に失敗しました。');
  console.log('\n💡 確認すべきポイント:');
  console.log('1. さくらの管理画面でメールアドレスが「使用中」になっているか');
  console.log('2. メールパスワードが正しく設定されているか（管理パスワードとは別）');
  console.log('3. メールボックスプランでSMTP送信が有効になっているか');
  console.log('4. ドメイン設定でMXレコードが正しく設定されているか');
  console.log('\n📞 さくらサポート: 0120-775-664 (平日10:00-18:00)');
  console.log('📧 サポート問い合わせ: https://help.sakura.ad.jp/inquiry/');
}

checkSakuraSettings().catch(console.error);