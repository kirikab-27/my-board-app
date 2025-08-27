// scripts/get-vercel-ip.js
// Vercelの実際のIPアドレスを取得

async function getVercelIPAddress() {
  console.log('🔍 VercelのIPアドレス取得');
  console.log('='.repeat(50));

  try {
    console.log('📤 本番環境IP取得API呼び出し中...');

    const response = await fetch('https://kab137lab.com/api/debug/ip');

    console.log(`📥 レスポンスステータス: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('\n📊 Vercel環境情報:');
      console.log(`環境: ${result.environment.NODE_ENV}`);
      console.log(`リージョン: ${result.environment.VERCEL_REGION}`);

      console.log('\n🌐 取得したIPアドレス:');
      result.ipAddresses.forEach((ipData, index) => {
        const ip = ipData.ip || ipData.origin || Object.values(ipData)[0];
        console.log(`${index + 1}. ${ip}`);
      });

      // さくらインターネット設定用の情報を表示
      console.log('\n📋 さくらインターネット設定手順:');
      console.log('='.repeat(50));
      console.log('1. さくらインターネット コントロールパネルにログイン');
      console.log('2. メール・メールアカウント設定');
      console.log('3. SMTP認証設定 または セキュリティ設定');
      console.log('4. 「送信元IP制限」または「外部SMTP接続許可」を探す');
      console.log('5. 上記のIPアドレスを許可リストに追加');

      // IP範囲も表示
      console.log('\n💡 Vercel公式IP範囲（参考）:');
      console.log('76.76.19.0/24 (Washington D.C.)');
      console.log('76.223.126.0/24 (San Francisco)');
      console.log('※ 実際のIPアドレスを優先して設定してください');
    } else {
      console.log('❌ IP取得APIに接続できませんでした');
    }
  } catch (error) {
    console.error('❌ IP取得エラー:', error.message);

    if (error.message.includes('404')) {
      console.log('💡 APIがまだデプロイされていません。少し待ってから再実行してください。');
    }
  }
}

// 実行
getVercelIPAddress().catch(console.error);
