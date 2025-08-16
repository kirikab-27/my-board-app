// scripts/check-mail-env.js
// 本番環境のメール設定確認

async function checkMailEnvironment() {
  console.log('🔍 本番環境メール設定確認');
  console.log('='.repeat(50));

  try {
    console.log('📤 本番環境API接続中...');

    const response = await fetch('https://kab137lab.com/api/debug/mail');

    console.log(`📥 レスポンスステータス: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('\n📊 本番環境メール設定:');
      console.log(JSON.stringify(result, null, 2));

      // 重要な設定を抜粋表示
      const env = result.environment;
      console.log('\n🔍 重要な設定チェック:');
      console.log(`SMTP_USER: ${env.SMTP_USER}`);
      console.log(`MAIL_FROM_ADDRESS: ${env.MAIL_FROM_ADDRESS}`);
      console.log(`一致している: ${result.diagnosis.smtp_user_matches_from_address ? '✅' : '❌'}`);

      if (!result.diagnosis.smtp_user_matches_from_address) {
        console.log('\n❌ 問題発見: SMTP_USERとMAIL_FROM_ADDRESSが一致していません');
        console.log('💡 解決策: Vercelダッシュボードで環境変数を修正してください');
      } else {
        console.log('\n✅ SMTP設定は正しく設定されています');
        console.log('💡 他の原因を調査する必要があります');
      }

      if (result.diagnosis.missing_vars.length > 0) {
        console.log('\n⚠️  不足している環境変数:');
        result.diagnosis.missing_vars.forEach((varName) => {
          console.log(`   - ${varName}`);
        });
      }
    } else {
      console.log('❌ API接続に失敗しました');
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);

    if (error.message.includes('404')) {
      console.log('💡 APIがまだデプロイされていません。少し待ってから再実行してください。');
    }
  }
}

// 実行
checkMailEnvironment().catch(console.error);
