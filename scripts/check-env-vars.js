// 環境変数確認スクリプト - Vercelデプロイ用
console.log('🔍 Vercelデプロイ用環境変数確認\n');

// 基本設定
const basicVars = {
  MONGODB_URI: process.env.MONGODB_URI,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  APP_URL: process.env.APP_URL,
  APP_NAME: process.env.APP_NAME,
};

// メール設定
const emailVars = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***設定済み***' : undefined,
  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
};

// OAuth設定
const oauthVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '***設定済み***' : undefined,
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET ? '***設定済み***' : undefined,
};

// Phase 4-5 新規環境変数
const phase45Vars = {
  SECURITY_API_TOKEN: process.env.SECURITY_API_TOKEN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
};

// 表示関数
function displayVars(title, vars) {
  console.log(`📋 ${title}:`);
  Object.entries(vars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value || '未設定';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });
  console.log('');
}

// 各セクション表示
displayVars('基本設定', basicVars);
displayVars('メール設定', emailVars);
displayVars('OAuth設定', oauthVars);
displayVars('Phase 4-5 新規環境変数', phase45Vars);

// Vercel本番用更新が必要な変数
console.log('🚀 Vercel本番環境用更新必須項目:');
const productionUpdates = [
  {
    key: 'NEXTAUTH_URL',
    current: process.env.NEXTAUTH_URL,
    required: 'https://my-board-app.vercel.app',
  },
  { key: 'APP_URL', current: process.env.APP_URL, required: 'https://my-board-app.vercel.app' },
  {
    key: 'SECURITY_API_TOKEN',
    current: process.env.SECURITY_API_TOKEN,
    required: '32文字以上のランダム文字列',
  },
];

productionUpdates.forEach((item) => {
  const needsUpdate = !item.current || item.current.includes('localhost');
  const status = needsUpdate ? '⚠️ 要更新' : '✅ 設定済み';
  console.log(`  ${status} ${item.key}: ${item.current || '未設定'} → ${item.required}`);
});

console.log('\n🔗 OAuth設定確認必須項目:');
console.log('  📍 Google OAuth Console:');
console.log('    - リダイレクトURI追加: https://my-board-app.vercel.app/api/auth/callback/google');
console.log('  📍 GitHub OAuth Apps:');
console.log('    - コールバックURL更新: https://my-board-app.vercel.app/api/auth/callback/github');
