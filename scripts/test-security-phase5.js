/**
 * Phase 5: セキュリティ強化機能テスト
 * XSS・CSRF・NoSQLインジェクション・監査ログのテスト
 */

import { config } from 'dotenv';

// 環境変数の読み込み
config({ path: '.env.local' });

const API_BASE = process.env.APP_URL || 'http://localhost:3010';

/**
 * テスト結果の記録
 */
class SecurityTestRunner {
  constructor() {
    this.results = {
      xss: { passed: 0, failed: 0, tests: [] },
      csrf: { passed: 0, failed: 0, tests: [] },
      nosql: { passed: 0, failed: 0, tests: [] },
      rateLimit: { passed: 0, failed: 0, tests: [] },
      audit: { passed: 0, failed: 0, tests: [] }
    };
  }

  async runTest(category, name, testFn) {
    try {
      console.log(`🧪 テスト実行: ${name}`);
      const result = await testFn();
      
      if (result.success) {
        this.results[category].passed++;
        console.log(`✅ ${name}: 成功`);
      } else {
        this.results[category].failed++;
        console.log(`❌ ${name}: 失敗 - ${result.message}`);
      }
      
      this.results[category].tests.push({
        name,
        success: result.success,
        message: result.message,
        details: result.details
      });
    } catch (error) {
      this.results[category].failed++;
      console.log(`❌ ${name}: エラー - ${error.message}`);
      this.results[category].tests.push({
        name,
        success: false,
        message: error.message,
        details: { error: error.stack }
      });
    }
  }

  printSummary() {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 Phase 5 セキュリティテスト結果サマリー');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([category, result]) => {
      const total = result.passed + result.failed;
      const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 0;
      
      console.log(`\\n${category.toUpperCase()}:`);
      console.log(`  成功: ${result.passed}/${total} (${percentage}%)`);
      
      if (result.failed > 0) {
        result.tests.filter(t => !t.success).forEach(test => {
          console.log(`  ❌ ${test.name}: ${test.message}`);
        });
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    const overallTotal = totalPassed + totalFailed;
    const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;
    
    console.log(`\\n全体結果: ${totalPassed}/${overallTotal} (${overallPercentage}%)`);
    
    if (overallPercentage >= 80) {
      console.log('🎉 Phase 5 セキュリティ強化: 合格基準達成！');
    } else {
      console.log('⚠️ Phase 5 セキュリティ強化: 改善が必要です');
    }
  }
}

/**
 * XSS攻撃テスト
 */
async function testXSSProtection() {
  const maliciousPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload="alert(1)">',
    '"><script>alert(1)</script>'
  ];

  let blockedCount = 0;
  const testResults = [];

  for (const payload of maliciousPayloads) {
    try {
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'XSSテスト',
          content: payload
        })
      });

      const result = await response.json();
      
      if (response.status === 400 && result.error === '不正なコンテンツが検出されました') {
        blockedCount++;
        testResults.push({ payload: payload.substring(0, 50), blocked: true });
      } else if (response.status === 401) {
        // 認証が必要 - 正常な動作
        testResults.push({ payload: payload.substring(0, 50), blocked: true, reason: 'auth_required' });
      } else {
        testResults.push({ payload: payload.substring(0, 50), blocked: false });
      }
    } catch (error) {
      testResults.push({ payload: payload.substring(0, 50), blocked: false, error: error.message });
    }
  }

  const success = blockedCount >= maliciousPayloads.length * 0.8; // 80%以上ブロック
  
  return {
    success,
    message: `XSSペイロード ${blockedCount}/${maliciousPayloads.length} ブロック`,
    details: testResults
  };
}

/**
 * NoSQLインジェクションテスト
 */
async function testNoSQLInjection() {
  const maliciousQueries = [
    { page: { '$gt': '' }, limit: 10 },
    { page: 1, limit: { '$where': 'function() { return true; }' } },
    { sortBy: { '$ne': null }, sortOrder: 'desc' },
    { search: { '$regex': '.*', '$options': 'i' } }
  ];

  let blockedCount = 0;
  const testResults = [];

  for (const query of maliciousQueries) {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });

      const response = await fetch(`${API_BASE}/api/posts?${params}`);
      const result = await response.json();
      
      if (response.status === 400 || (result.posts && result.posts.length === 0)) {
        blockedCount++;
        testResults.push({ query: JSON.stringify(query), blocked: true });
      } else {
        testResults.push({ query: JSON.stringify(query), blocked: false });
      }
    } catch (error) {
      testResults.push({ query: JSON.stringify(query), blocked: false, error: error.message });
    }
  }

  const success = blockedCount >= maliciousQueries.length * 0.5; // 50%以上ブロック
  
  return {
    success,
    message: `NoSQLインジェクション ${blockedCount}/${maliciousQueries.length} ブロック`,
    details: testResults
  };
}

/**
 * レート制限テスト
 */
async function testRateLimit() {
  const requests = [];
  const maxRequests = 10; // 制限の2倍
  
  console.log('📡 レート制限テスト開始...');
  
  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      fetch(`${API_BASE}/api/posts?page=1&limit=5`)
        .then(response => ({
          status: response.status,
          attempt: i + 1
        }))
        .catch(error => ({
          status: 'error',
          error: error.message,
          attempt: i + 1
        }))
    );
  }

  const results = await Promise.all(requests);
  const blockedRequests = results.filter(r => r.status === 429);
  
  const success = blockedRequests.length > 0; // 制限が動作している
  
  return {
    success,
    message: `レート制限: ${blockedRequests.length} リクエストがブロック`,
    details: {
      totalRequests: maxRequests,
      successfulRequests: results.filter(r => r.status === 200).length,
      blockedRequests: blockedRequests.length,
      errorRequests: results.filter(r => r.status === 'error').length
    }
  };
}

/**
 * CSRF保護テスト
 */
async function testCSRFProtection() {
  const testRequests = [
    {
      name: 'Origin ヘッダーなし',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: '無効な Origin ヘッダー',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://evil.com'
      }
    },
    {
      name: '無効な Referer ヘッダー',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://malicious-site.com/attack'
      }
    }
  ];

  let blockedCount = 0;
  const testResults = [];

  for (const testCase of testRequests) {
    try {
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: testCase.headers,
        body: JSON.stringify({
          title: 'CSRF Test',
          content: 'This is a CSRF test'
        })
      });

      const result = await response.json();
      const isBlocked = response.status === 403 || response.status === 400;
      
      if (isBlocked) {
        blockedCount++;
      }
      
      testResults.push({
        name: testCase.name,
        status: response.status,
        blocked: isBlocked,
        message: result.error || result.message
      });
    } catch (error) {
      testResults.push({
        name: testCase.name,
        blocked: false,
        error: error.message
      });
    }
  }

  const success = blockedCount >= testRequests.length * 0.8; // 80%以上ブロック
  
  return {
    success,
    message: `CSRF攻撃 ${blockedCount}/${testRequests.length} ブロック`,
    details: testResults
  };
}

/**
 * 監査ログ機能テスト
 */
async function testAuditLogging() {
  try {
    console.log('📋 監査ログ機能テスト...');
    
    // 監査ログAPIへのアクセス（管理者権限が必要）
    const response = await fetch(`${API_BASE}/api/security/audit?action=statistics&days=1`);
    
    if (response.status === 403) {
      return {
        success: true,
        message: '監査ログAPI: 認証保護が正常に動作',
        details: { protected: true }
      };
    }
    
    if (response.status === 200) {
      const data = await response.json();
      return {
        success: true,
        message: '監査ログAPI: データ取得成功',
        details: { dataReceived: !!data.summary }
      };
    }
    
    return {
      success: false,
      message: `監査ログAPI: 予期しないレスポンス ${response.status}`,
      details: { status: response.status }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `監査ログテストエラー: ${error.message}`,
      details: { error: error.stack }
    };
  }
}

/**
 * メインテスト実行
 */
async function runSecurityTests() {
  console.log('🔒 Phase 5 セキュリティ強化機能テスト開始');
  console.log(`🌐 テスト対象: ${API_BASE}`);
  console.log('⏰ 開始時刻:', new Date().toLocaleString('ja-JP'));
  
  const runner = new SecurityTestRunner();
  
  // XSS対策テスト
  await runner.runTest('xss', 'XSS攻撃ブロック', testXSSProtection);
  
  // NoSQLインジェクションテスト
  await runner.runTest('nosql', 'NoSQLインジェクション対策', testNoSQLInjection);
  
  // レート制限テスト
  await runner.runTest('rateLimit', 'レート制限（1分5回）', testRateLimit);
  
  // CSRF保護テスト
  await runner.runTest('csrf', 'CSRF保護', testCSRFProtection);
  
  // 監査ログテスト
  await runner.runTest('audit', '監査ログシステム', testAuditLogging);
  
  // 結果サマリー
  runner.printSummary();
  
  console.log('\\n⏰ 終了時刻:', new Date().toLocaleString('ja-JP'));
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests().catch(console.error);
}

export { runSecurityTests };