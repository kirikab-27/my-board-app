// scripts/test-auth.js
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testDifferentAuthMethods() {
  console.log('🔐 さくらメール認証方法テスト');
  console.log('='.repeat(50));
  
  console.log('\n現在の認証情報:');
  console.log(`ユーザー名: ${process.env.SMTP_USER}`);
  console.log(`パスワード長: ${process.env.SMTP_PASSWORD?.length}文字`);
  
  const authMethods = [
    {
      name: '方法1: AUTH PLAIN（デフォルト）',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: '方法2: AUTH LOGIN 強制',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        authMethod: 'LOGIN',
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: '方法3: CRAM-MD5',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        authMethod: 'CRAM-MD5',
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: '方法4: メールアドレス全体をユーザー名として使用',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: 'noreply@kab137lab.com',  // 完全なメールアドレス
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      }
    },
    {
      name: '方法5: ユーザー名部分のみを使用',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: 'noreply',  // @より前の部分のみ
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
  ];

  for (const { name, config } of authMethods) {
    console.log(`\n🔧 ${name}`);
    console.log(`   認証ユーザー: ${config.auth.user}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      console.log(`✅ ${name}: 接続成功！`);
      
      // 成功した設定を表示
      console.log('\n🎉 使用すべき設定:');
      console.log(`SMTP_USER=${config.auth.user}`);
      if (config.authMethod) {
        console.log(`認証方法: ${config.authMethod}`);
      }
      
      // テストメール送信
      console.log('\n📧 テストメール送信中...');
      const info = await transporter.sendMail({
        from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
        to: process.env.ADMIN_EMAIL,
        subject: '【成功】さくらメール認証テスト',
        text: `認証方法「${name}」で接続に成功しました。\n\n送信時刻: ${new Date().toLocaleString('ja-JP')}`,
        html: `<h2>認証成功</h2><p>認証方法「${name}」で接続に成功しました。</p><p>送信時刻: ${new Date().toLocaleString('ja-JP')}</p>`
      });
      
      console.log(`✅ メール送信成功: ${info.messageId}`);
      break;
      
    } catch (error) {
      console.log(`❌ 失敗: ${error.message}`);
    }
  }
  
  console.log('\n\n💡 追加の確認事項:');
  console.log('1. さくらの管理画面でメールアドレスの状態を確認');
  console.log('2. パスワードに特殊文字が含まれる場合は、シンプルなパスワードに変更してテスト');
  console.log('3. メールボックスの容量が上限に達していないか確認');
  console.log('4. さくらのサポートに問い合わせ: https://help.sakura.ad.jp/');
}

testDifferentAuthMethods().catch(console.error);