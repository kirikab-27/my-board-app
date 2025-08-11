// ブルートフォース攻撃シミュレーション・テストスクリプト
// Node.js組み込みのhttpsモジュールを使用
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3010';
const TEST_EMAIL = 'test-target@example.com';
const WRONG_PASSWORD = 'WrongPassword123';

/**
 * HTTP POSTリクエスト送信（Node.js組み込みモジュール使用）
 */
function makeRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * ログイン試行テスト
 */
async function attemptLogin(email, password, attempt = 1) {
  try {
    console.log(`🔍 試行 ${attempt}: ${email} でログイン試行中...`);
    
    const response = await makeRequest(`${BASE_URL}/api/auth/signin`, {
      email,
      password,
      redirect: false
    }, {
      'User-Agent': `BruteForceTest-Attempt-${attempt}`
    });
    
    return {
      success: response.status === 200,
      status: response.status,
      data: response.data,
      attempt
    };
    
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
      attempt
    };
  }
}

/**
 * 連続ログイン失敗テスト
 */
async function testBruteForceProtection() {
  console.log('🚨 ブルートフォース攻撃保護テスト開始\n');
  console.log(`標的ユーザー: ${TEST_EMAIL}`);
  console.log(`間違ったパスワード: ${WRONG_PASSWORD}\n`);

  const results = [];
  const MAX_ATTEMPTS = 15; // 制限値を超える試行回数

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const result = await attemptLogin(TEST_EMAIL, WRONG_PASSWORD, i);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ 試行 ${i}: 成功 (予期せぬ成功)`);
    } else {
      console.log(`❌ 試行 ${i}: 失敗 - Status: ${result.status}`);
      
      if (result.error) {
        console.log(`   エラー: ${JSON.stringify(result.error)}`);
      }
    }
    
    // レート制限に引っかかった場合の詳細表示
    if (result.status === 429 || (result.error && result.error.includes && result.error.includes('制限'))) {
      console.log(`🚫 試行 ${i}: レート制限検出!`);
      console.log(`   制限メッセージ: ${result.error}`);
    }
    
    // 小さな待機時間（サーバー負荷軽減）
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 テスト結果サマリー:');
  console.log(`総試行回数: ${results.length}`);
  console.log(`成功回数: ${results.filter(r => r.success).length}`);
  console.log(`失敗回数: ${results.filter(r => !r.success).length}`);
  
  const blockedAttempts = results.filter(r => 
    r.status === 429 || 
    (r.error && typeof r.error === 'string' && r.error.includes('制限'))
  );
  
  console.log(`ブロックされた試行: ${blockedAttempts.length}`);
  
  if (blockedAttempts.length > 0) {
    console.log(`最初にブロックされた試行: ${blockedAttempts[0].attempt}`);
    console.log('✅ ブルートフォース保護が正常に動作しています!');
  } else {
    console.log('❌ ブルートフォース保護が動作していない可能性があります');
  }
}

/**
 * IP制限テスト（異なるIP模擬）
 */
async function testIPRateLimit() {
  console.log('\n🌐 IP制限テスト開始\n');
  
  // 複数のIPからの攻撃をシミュレーション
  const testIPs = [
    '192.168.1.100',
    '192.168.1.101', 
    '192.168.1.102'
  ];
  
  for (const testIP of testIPs) {
    console.log(`IP ${testIP} からの攻撃シミュレーション:`);
    
    for (let i = 1; i <= 12; i++) { // IP制限を超える回数
      const result = await attemptLogin(TEST_EMAIL, WRONG_PASSWORD, i);
      
      if (result.success) {
        console.log(`  ✅ 試行 ${i}: 成功`);
      } else {
        console.log(`  ❌ 試行 ${i}: 失敗 - Status: ${result.status}`);
        
        if (result.status === 429 || (result.error && result.error.includes && result.error.includes('IP'))) {
          console.log(`  🚫 IP制限検出! 試行 ${i} でブロック`);
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('');
  }
}

/**
 * 正常ユーザーへの影響テスト
 */
async function testLegitimateUserImpact() {
  console.log('\n👤 正常ユーザーへの影響テスト\n');
  
  // 異なるユーザーが影響を受けないかテスト
  const legitUser = 'legitimate-user@example.com';
  const legitPassword = 'CorrectPassword123';
  
  console.log(`正常ユーザー ${legitUser} でのログイン試行:`);
  
  const result = await attemptLogin(legitUser, legitPassword);
  
  if (result.success) {
    console.log('✅ 正常ユーザーは影響を受けていません');
  } else {
    console.log('⚠️  正常ユーザーも影響を受けている可能性があります');
    console.log(`エラー: ${JSON.stringify(result.error)}`);
  }
}

/**
 * 時間経過によるリセット確認テスト
 */
async function testTimeBasedReset() {
  console.log('\n⏰ 時間経過リセットテスト\n');
  console.log('制限時間経過後の動作確認は手動で実行してください');
  console.log('設定値:');
  console.log('- ユーザー制限: 15分で5回まで、30分ロック');
  console.log('- IP制限: 15分で10回まで、1時間ロック');
  console.log('- 段階的ロック: 1分 → 5分 → 15分 → 1時間');
}

/**
 * メインテスト実行
 */
async function runAllTests() {
  try {
    console.log('🔒 ブルートフォース攻撃保護テスト開始\n');
    console.log(`テスト対象サーバー: ${BASE_URL}\n`);
    
    // 1. ユーザーベースブルートフォーステスト
    await testBruteForceProtection();
    
    // 2. IP制限テスト
    // await testIPRateLimit(); // 実際のIPが同じなのでコメントアウト
    
    // 3. 正常ユーザーへの影響テスト
    await testLegitimateUserImpact();
    
    // 4. 時間リセット情報
    await testTimeBasedReset();
    
    console.log('\n✅ 全テスト完了');
    console.log('\n🔧 手動確認項目:');
    console.log('1. サーバーコンソールでログイン失敗ログを確認');
    console.log('2. 制限時間経過後の動作確認');
    console.log('3. セキュリティ統計API（/api/security/stats）で状況確認');
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
  }
}

// Node.jsから直接実行された場合のみテストを実行
if (require.main === module) {
  runAllTests();
}

module.exports = {
  attemptLogin,
  testBruteForceProtection,
  testIPRateLimit,
  testLegitimateUserImpact,
  runAllTests
};