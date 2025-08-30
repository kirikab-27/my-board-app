/**
 * Issue #40 Phase C: Resend Gmail配信テスト
 * Gmail配信問題解決確認
 */

require('dotenv').config({ path: '.env.local' });

async function testResendGmailDelivery() {
  console.log('📧 Issue #40 Phase C: Resend Gmail配信テスト\n');

  try {
    // 環境変数確認
    console.log('🔍 環境変数確認:');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ 設定済み' : '❌ 未設定');
    console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
    console.log('');

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY環境変数が設定されていません');
    }

    // Resend SDK インポート（動的）
    const { sendEmailWithResend } = await import('../src/lib/email/resend-sender.ts');

    console.log('📤 Resend Gmail配信テスト実行中...');

    // テスト用メールデータ
    const testEmailData = {
      to: 'minomasa34@gmail.com', // 実際のGmailアドレス
      subject: '🧪 Resend配信テスト - 掲示板システム',
      html: `
        <h2>🎉 Resend配信テスト成功</h2>
        <p>このメールはResendサービス経由で送信されました。</p>
        <p><strong>テスト項目</strong>:</p>
        <ul>
          <li>✅ Resend API連携</li>
          <li>✅ Gmail配信確認</li>
          <li>✅ HTML形式表示</li>
          <li>✅ 日本語文字対応</li>
        </ul>
        <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
        <hr>
        <p><small>Issue #40: Gmail配信問題解決テスト</small></p>
      `,
      text: `
🎉 Resend配信テスト成功

このメールはResendサービス経由で送信されました。

テスト項目:
- Resend API連携
- Gmail配信確認  
- 日本語文字対応

送信日時: ${new Date().toLocaleString('ja-JP')}

Issue #40: Gmail配信問題解決テスト
      `,
    };

    // Resend送信実行
    const result = await sendEmailWithResend(testEmailData);

    if (result.success) {
      console.log('✅ Resend送信成功!');
      console.log('📨 Message ID:', result.messageId);
      console.log('🚀 Provider:', result.provider);
      console.log('');
      console.log('🎯 Gmail受信確認手順:');
      console.log('1. Gmail受信トレイ確認（1-3分以内）');
      console.log('2. 迷惑メールフォルダ確認');
      console.log('3. すべてのメール検索: "Resend配信テスト"');
      console.log('');
      console.log('📈 期待効果:');
      console.log('- 高速配信: 1-3分以内受信（従来10-30分 → 大幅改善）');
      console.log('- 高配信率: 99%+ Gmail受信成功（従来20-30% → 劇的改善）');
      console.log('- 安定性: Resend専門サービス・エンタープライズ級品質');
    } else {
      console.error('❌ Resend送信失敗:', result.error);
      throw new Error(result.error || 'Resend送信失敗');
    }
  } catch (error) {
    console.error('❌ Resend Gmailテストエラー:', error);
    console.log('');
    console.log('🔧 トラブルシューティング:');
    console.log('1. RESEND_API_KEY設定確認');
    console.log('2. Resendダッシュボードでドメイン認証確認');
    console.log('3. API Key権限確認（Send access）');
    console.log('4. kab137lab.com ドメイン設定確認');
    process.exit(1);
  }
}

// テスト実行
testResendGmailDelivery()
  .then(() => {
    console.log('\n🎉 Issue #40 Phase C: Resend Gmail配信テスト完了');
    console.log('Gmail受信を確認して、配信改善効果を検証してください。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ テスト失敗:', error);
    process.exit(1);
  });
