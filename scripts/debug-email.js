// scripts/debug-email.js
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function debugSMTPConnection() {
  console.log('🔍 SMTP設定デバッグ');
  console.log('='.repeat(50));
  
  console.log('\n📋 環境変数チェック:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? `${process.env.SMTP_PASSWORD.substring(0, 3)}***` : '未設定'}`);
  
  // 異なる設定でテスト
  const configurations = [
    {
      name: '標準設定 (587番ポート、STARTTLS)',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'SSL設定 (465番ポート、SSL)',
      config: {
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      }
    },
    {
      name: '非暗号化設定 (25番ポート)',
      config: {
        host: process.env.SMTP_HOST,
        port: 25,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      }
    }
  ];

  for (const { name, config } of configurations) {
    console.log(`\n🔧 ${name} をテスト中...`);
    console.log(`   ホスト: ${config.host}:${config.port}`);
    console.log(`   暗号化: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      console.log(`✅ ${name}: 接続成功！`);
      
      // 接続成功した場合、詳細を表示
      console.log('   この設定を使用してください:');
      console.log(`   SMTP_HOST=${config.host}`);
      console.log(`   SMTP_PORT=${config.port}`);
      console.log(`   SMTP_SECURE=${config.secure}`);
      
      break; // 成功したら終了
      
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // さくらのメール設定のヒント
  console.log('\n💡 さくらインターネット設定のヒント:');
  console.log('1. 管理画面でメールアドレスが正しく作成されているか確認');
  console.log('2. メールパスワードが正しいか確認（ログインパスワードとは別）');
  console.log('3. SMTP認証が有効になっているか確認');
  console.log('4. セキュリティ設定でSMTP接続が許可されているか確認');
  console.log('\n📞 さくらインターネットサポート: https://help.sakura.ad.jp/');
}

debugSMTPConnection().catch(console.error);