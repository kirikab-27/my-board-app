// scripts/test-verification-email.js
require('dotenv').config({ path: '.env.local' });

const { sendVerificationEmail } = require('../src/lib/email/react-email-sender');

async function testVerificationEmail() {
  console.log('🧪 認証メール送信テスト');
  console.log('='.repeat(50));

  // テスト用ユーザー情報
  const testEmail = 'test@example.com'; // あなたのメールアドレスに変更してください
  const testName = 'テストユーザー';
  const testToken = 'test-verification-token-12345';

  console.log(`📧 送信先: ${testEmail}`);
  console.log(`👤 名前: ${testName}`);
  console.log(`🔑 トークン: ${testToken}`);

  try {
    console.log('\n📤 認証メール送信中...');
    const result = await sendVerificationEmail(testEmail, testName, testToken);

    if (result.success) {
      console.log('✅ 認証メール送信成功！');
      console.log(`📩 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ 認証メール送信失敗');
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    console.error('詳細:', error);
  }
}

// 実行
testVerificationEmail().catch(console.error);
