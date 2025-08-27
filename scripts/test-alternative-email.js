// scripts/test-alternative-email.js
// 異なるメールプロバイダーでテスト

async function testAlternativeEmail() {
  console.log('🧪 別メールプロバイダーでテスト');
  console.log('='.repeat(50));

  const testEmails = ['test@yahoo.co.jp', 'test@outlook.com', 'test@icloud.com'];

  console.log('📋 テスト用メールアドレス（実際には存在しない）:');
  testEmails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });

  console.log('\n💡 次のステップ:');
  console.log('1. 上記以外の実際のメールアドレス（Yahoo、Outlook等）で新規登録テスト');
  console.log('2. Gmailとの違いを確認');
  console.log('3. Gmail以外で届けばGmail側の問題');
  console.log('4. 届かなければさくら側の設定問題');
}

testAlternativeEmail();
