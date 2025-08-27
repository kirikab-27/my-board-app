// scripts/test-register-api.js
require('dotenv').config({ path: '.env.local' });

async function testRegisterAPI() {
  console.log('🧪 新規登録API認証メール送信テスト');
  console.log('='.repeat(50));

  // テスト用ユーザー情報（実際のメールアドレスに変更してください）
  const testData = {
    name: 'テストユーザー',
    email: 'test@example.com', // ← ここを実際のメールアドレスに変更
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
  };

  console.log(`📧 送信先: ${testData.email}`);
  console.log(`👤 名前: ${testData.name}`);

  try {
    console.log('\n📤 新規登録API呼び出し中...');

    const response = await fetch('http://localhost:3010/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`📥 レスポンスステータス: ${response.status}`);

    const result = await response.json();
    console.log('📥 レスポンス内容:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ 新規登録成功！');
      console.log('📧 認証メールが送信されているはずです');
      console.log('\n📋 次の手順:');
      console.log('1. メールボックス（迷惑メールフォルダも含む）を確認');
      console.log('2. 認証メールのリンクをクリック');
      console.log('3. ログインページでログイン');
    } else {
      console.log('❌ 新規登録失敗');
      console.log('エラー:', result.error);
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  }
}

// 実行
testRegisterAPI().catch(console.error);
