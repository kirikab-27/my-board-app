// scripts/analyze-ip-reputation.js
// ローカルと本番のIP信頼度分析

async function analyzeIPReputation() {
  console.log('🔍 IP信頼度分析: ローカル vs 本番');
  console.log('='.repeat(60));

  console.log('📍 ローカル環境（localhost）:');
  console.log('├── 送信元IP: 家庭・オフィスIP（一般的に信頼度高）');
  console.log('├── ISP: 日本の大手プロバイダー（NTT、KDDI等）');
  console.log('├── 地理的位置: 日本国内');
  console.log('├── IP履歴: 長期使用・メール送信実績あり');
  console.log('└── Gmail判定: ✅ 信頼できる送信元');

  console.log('\n📍 本番環境（Vercel）:');
  console.log('├── 送信元IP: 外国データセンター（米国等）');
  console.log('├── ISP: クラウドプロバイダー（AWS、Vercel等）');
  console.log('├── 地理的位置: 海外');
  console.log('├── IP履歴: 短期・大量送信の可能性');
  console.log('└── Gmail判定: ❌ 疑わしい送信元');

  console.log('\n🎯 Gmail側の判断基準:');
  console.log('┌─────────────────────────────────────┐');
  console.log('│ 信頼度要素          ローカル  本番   │');
  console.log('├─────────────────────────────────────┤');
  console.log('│ 送信者IP信頼度      ✅ 高    ❌ 低  │');
  console.log('│ 地理的位置          ✅ 国内  ❌ 海外│');
  console.log('│ ISP種別            ✅ 一般  ❌ 商用│');
  console.log('│ ドメイン年齢        ✅ 同じ  ✅ 同じ│');
  console.log('│ 総合判定            ✅ 配信  ❌ 拒否│');
  console.log('└─────────────────────────────────────┘');

  console.log('\n💡 解決策:');
  console.log('1. Resend移行（Gmailホワイトリスト済みIP使用）');
  console.log('2. 日本国内VPS経由送信（ConoHa、さくらVPS等）');
  console.log('3. メール送信専用サービス（SendGrid、AWS SES等）');
}

analyzeIPReputation();
