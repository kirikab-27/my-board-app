// scripts/check-production-env.js
// 本番環境の環境変数設定確認用API

async function checkProductionEnvironment() {
  console.log('🔍 本番環境の環境変数設定確認');
  console.log('='.repeat(50));

  try {
    console.log('📤 本番環境APIに接続中...');

    // 環境変数チェック用の簡単なAPIを呼び出し
    const response = await fetch('https://kab137lab.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'ENV_CHECK',
        email: 'env-check@test.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }),
    });

    console.log(`📥 レスポンスステータス: ${response.status}`);

    const result = await response.json();
    console.log('📥 レスポンス:', JSON.stringify(result, null, 2));

    // SMTP設定の有無を判断
    if (result.error && result.error.includes('SMTP')) {
      console.log('❌ 本番環境でSMTP設定エラーが発生している可能性があります');
    } else if (result.error && result.error.includes('メール')) {
      console.log('❌ 本番環境でメール送信関連エラーが発生しています');
    } else if (response.status === 200) {
      console.log(
        '✅ 本番環境での登録APIは動作していますが、メール送信部分をより詳しく調査が必要です'
      );
    }
  } catch (error) {
    console.error('❌ 本番環境への接続エラー:', error.message);
  }
}

// ローカル環境の必要な環境変数一覧
console.log('📋 メール送信に必要な環境変数 (ローカルで動作中):');
console.log('SMTP_HOST=kab137lab.sakura.ne.jp');
console.log('SMTP_PORT=587');
console.log('SMTP_SECURE=false');
console.log('SMTP_USER=noreply@kab137lab.sakura.ne.jp');
console.log('SMTP_PASSWORD="Noreply#2025Kab!"');
console.log('MAIL_FROM_ADDRESS=noreply@kab137lab.com');
console.log('MAIL_FROM_NAME=掲示板システム｜KAB137Lab');
console.log('APP_URL=https://kab137lab.com');
console.log('APP_NAME=掲示板システム');
console.log('');

console.log('🔧 Vercelダッシュボードで以下を確認してください:');
console.log('1. https://vercel.com/dashboard');
console.log('2. my-board-app プロジェクト → Settings → Environment Variables');
console.log('3. 上記の環境変数がすべて設定されているかチェック');
console.log('4. 特に SMTP_PASSWORD の値が正しく設定されているかチェック');
console.log('');

checkProductionEnvironment().catch(console.error);
