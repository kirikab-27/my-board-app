// scripts/test-production-smtp.js
// 本番環境のSMTP接続テスト

async function testProductionSMTP() {
  console.log('🔍 本番環境SMTP接続テスト');
  console.log('='.repeat(50));

  try {
    console.log('📤 本番環境SMTP接続テストAPI呼び出し中...');

    // SMTP接続テストAPI呼び出し
    const response = await fetch('https://kab137lab.com/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📥 レスポンスステータス: ${response.status}`);

    const result = await response.json();
    console.log('📥 テスト結果:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ 本番環境SMTP接続・メール送信成功！');
      console.log(`📩 Message ID: ${result.sendResult?.messageId}`);
      console.log('💡 本番環境のメール送信は正常に動作しています');
      console.log('   問題はメール配信側（プロバイダーブロック等）の可能性があります');
    } else {
      console.log('\n❌ 本番環境SMTP接続・メール送信失敗');
      console.log('エラー:', result.error);

      // エラー分析
      if (result.error.includes('ENOTFOUND')) {
        console.log('💡 DNS解決エラー: SMTP_HOSTの設定を確認してください');
      } else if (result.error.includes('ECONNREFUSED')) {
        console.log('💡 接続拒否: ポート番号またはファイアウォール設定を確認してください');
      } else if (result.error.includes('Invalid login')) {
        console.log('💡 認証エラー: SMTP_USERまたはSMTP_PASSWORDを確認してください');
      } else if (result.error.includes('timeout')) {
        console.log('💡 タイムアウト: ネットワーク接続またはVercelの制限の可能性があります');
      } else {
        console.log('💡 その他のエラー: 詳細ログを確認してください');
      }
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);

    if (error.message.includes('404')) {
      console.log('💡 APIがまだデプロイされていません。2-3分待ってから再実行してください。');
    }
  }
}

// 実行
testProductionSMTP().catch(console.error);
