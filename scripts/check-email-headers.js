// scripts/check-email-headers.js
// メールヘッダー情報確認用

async function checkEmailHeaders() {
  console.log('📧 メールヘッダー情報確認');
  console.log('='.repeat(50));

  try {
    console.log('📤 デバッグAPI呼び出し中...');

    const response = await fetch('https://kab137lab.com/api/debug/mail');

    if (response.ok) {
      const result = await response.json();
      console.log('\n📊 現在のメール設定:');
      console.log(`送信者: ${result.environment.CALCULATED_FROM}`);
      console.log(`SMTP_HOST: ${result.environment.SMTP_HOST}`);
      console.log(`SMTP_PORT: ${result.environment.SMTP_PORT}`);

      console.log('\n🔍 Gmail配信問題の可能性:');
      console.log('1. SPF認証失敗');
      console.log('2. DKIM署名なし');
      console.log('3. 新規ドメインの信頼度不足');
      console.log('4. Gmail側の厳格フィルタリング');

      console.log('\n📋 確認手順:');
      console.log('1. さくらコントロールパネル → ドメイン設定');
      console.log('2. SPF/DKIM設定状況確認');
      console.log('3. 別のメールプロバイダー（Yahoo等）でテスト');
      console.log('4. Gmail以外で届けばGmail固有問題');
    } else {
      console.log('❌ API接続に失敗しました');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkEmailHeaders().catch(console.error);
