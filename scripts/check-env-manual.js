// 環境変数手動確認スクリプト
const fs = require('fs');
const path = require('path');

console.log('🔍 .env.local ファイル直接読み取り確認\n');

// .env.local ファイルを読み取り
const envPath = path.join(__dirname, '..', '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

  const envVars = {};
  envLines.forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').replace(/"/g, '');
    }
  });

  console.log('📋 現在の環境変数（.env.local）:\n');

  // 基本設定
  console.log('🔧 基本設定:');
  const basicVars = ['MONGODB_URI', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'APP_URL', 'APP_NAME'];
  basicVars.forEach((key) => {
    const value = envVars[key];
    const status = value ? '✅' : '❌';
    const display = key.includes('SECRET') && value ? '***設定済み***' : value || '未設定';
    console.log(`  ${status} ${key}: ${display}`);
  });

  // メール設定
  console.log('\n📧 メール設定:');
  const emailVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'MAIL_FROM_ADDRESS',
    'MAIL_FROM_NAME',
  ];
  emailVars.forEach((key) => {
    const value = envVars[key];
    const status = value ? '✅' : '❌';
    const display = key.includes('PASSWORD') && value ? '***設定済み***' : value || '未設定';
    console.log(`  ${status} ${key}: ${display}`);
  });

  // OAuth設定
  console.log('\n🔐 OAuth設定:');
  const oauthVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_ID', 'GITHUB_SECRET'];
  oauthVars.forEach((key) => {
    const value = envVars[key];
    const status = value ? '✅' : '❌';
    const isDefault = value && (value.includes('your_') || value.includes('demo_'));
    const display = key.includes('SECRET') && value ? '***設定済み***' : value || '未設定';
    const statusIcon = isDefault ? '⚠️' : value ? '✅' : '❌';
    console.log(`  ${statusIcon} ${key}: ${display}${isDefault ? ' (デフォルト値)' : ''}`);
  });

  // Phase 4-5新規環境変数チェック
  console.log('\n🆕 Phase 4-5 新規環境変数:');
  const phase45Vars = [
    'SECURITY_API_TOKEN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SLACK_WEBHOOK_URL',
  ];
  let newVarsNeeded = [];
  phase45Vars.forEach((key) => {
    const value = envVars[key];
    const status = value ? '✅' : '❌';
    if (!value) newVarsNeeded.push(key);
    console.log(`  ${status} ${key}: ${value || '未設定'}`);
  });

  // Vercel本番用設定チェック
  console.log('\n🚀 Vercel本番環境用更新必要項目:');
  const productionChecks = [
    {
      key: 'NEXTAUTH_URL',
      current: envVars['NEXTAUTH_URL'],
      required: 'https://my-board-app.vercel.app',
    },
    { key: 'APP_URL', current: envVars['APP_URL'], required: 'https://my-board-app.vercel.app' },
    { key: 'MONGODB_URI', current: envVars['MONGODB_URI'], note: '本番用MongoDB接続文字列確認' },
  ];

  productionChecks.forEach((item) => {
    const needsUpdate = !item.current || item.current.includes('localhost');
    const status = needsUpdate ? '⚠️' : '✅';
    console.log(
      `  ${status} ${item.key}: ${item.note || `${item.current || '未設定'} → ${item.required}`}`
    );
  });

  // 新規追加が必要な環境変数
  if (newVarsNeeded.length > 0) {
    console.log('\n📝 Vercelに新規追加必要な環境変数:');
    newVarsNeeded.forEach((key) => {
      let suggestion = '';
      switch (key) {
        case 'SECURITY_API_TOKEN':
          suggestion = 'ランダムな32文字以上の文字列';
          break;
        case 'NEXT_PUBLIC_SENTRY_DSN':
        case 'SENTRY_DSN':
          suggestion = 'Sentryプロジェクト作成後のDSN（オプション）';
          break;
        case 'SLACK_WEBHOOK_URL':
          suggestion = 'Slackアラート用WebhookURL（オプション）';
          break;
        default:
          suggestion = 'プロジェクト要件に応じて設定';
      }
      console.log(`  📋 ${key}: ${suggestion}`);
    });
  }

  console.log('\n🔗 OAuth設定確認チェックリスト:');
  console.log('  📍 Google OAuth Console (https://console.cloud.google.com/):');
  console.log('    1. 認証情報 → OAuth 2.0 クライアント ID選択');
  console.log(
    '    2. 承認済みリダイレクトURIに追加: https://my-board-app.vercel.app/api/auth/callback/google'
  );
  console.log('  📍 GitHub OAuth Apps (https://github.com/settings/developers):');
  console.log('    1. OAuth Apps → 該当アプリ選択');
  console.log(
    '    2. Authorization callback URLに追加: https://my-board-app.vercel.app/api/auth/callback/github'
  );
} catch (error) {
  console.error('❌ .env.local ファイル読み取りエラー:', error.message);
}
