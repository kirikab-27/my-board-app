// scripts/check-production-debug.js
// 本番環境のデバッグAPI確認

async function checkProductionDebug() {
  console.log('🔍 本番環境デバッグ情報取得');
  console.log('='.repeat(50));

  try {
    console.log('📤 本番環境デバッグAPIに接続中...');

    // デバッグAPI呼び出し
    const response = await fetch('https://kab137lab.com/api/debug/env');

    console.log(`📥 レスポンスステータス: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('📥 本番環境の設定情報:');
      console.log(JSON.stringify(result, null, 2));

      // 環境変数の分析
      const env = result.environment;
      console.log('\n🔍 環境変数分析:');

      const requiredVars = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'MAIL_FROM_ADDRESS',
        'MAIL_FROM_NAME',
        'APP_URL',
        'APP_NAME',
      ];

      const missingVars = requiredVars.filter((varName) => env[varName] === 'MISSING');

      if (missingVars.length > 0) {
        console.log('❌ 不足している環境変数:');
        missingVars.forEach((varName) => {
          console.log(`   - ${varName}`);
        });
      } else {
        console.log('✅ 必要な環境変数はすべて設定されています');
      }

      // メール設定の分析
      console.log('\n📧 メール設定分析:');
      console.log(`   SMTP設定テスト: ${result.emailConfigTest}`);

      if (result.emailConfigTest === 'CONFIG_VALID') {
        console.log('✅ SMTP設定は有効です');
        console.log('\n💡 メール送信問題の可能性:');
        console.log('1. さくらインターネットのSMTP制限');
        console.log('2. Vercelサーバーからの外部SMTP接続制限');
        console.log('3. メールプロバイダーによるブロック');
        console.log('4. ネットワークタイムアウト');
      } else {
        console.log('❌ SMTP設定に問題があります');
      }
    } else {
      console.log('❌ デバッグAPIへの接続に失敗しました');
      const errorText = await response.text();
      console.log('エラー内容:', errorText);
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  }
}

// 実行
checkProductionDebug().catch(console.error);
