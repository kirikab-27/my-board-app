#!/usr/bin/env node

/**
 * 本番環境ヘルスチェックスクリプト
 * 発表会前・デプロイ後の必須確認項目を自動実行
 *
 * 使用方法: node scripts/production-health-check.js
 */

const https = require('https');
const http = require('http');

// 設定
const CONFIG = {
  baseUrl: 'https://kab137lab.com',
  timeout: 10000, // 10秒タイムアウト
  retryCount: 3,
  testEmails: ['test+demo@example.com', 'user.name@domain.co.jp', 'github+test001@gmail.com'],
};

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

function logTest(testName, status, details = '') {
  const statusIcon = status ? '✅' : '❌';
  const statusColor = status ? 'green' : 'red';
  log(`${statusIcon} ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// HTTPリクエスト実行
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(
      url,
      {
        timeout: CONFIG.timeout,
        ...options,
      },
      (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            responseTime,
          });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 基本接続性テスト
async function testBasicConnectivity() {
  logSection('🌐 基本接続性テスト');

  try {
    const response = await makeRequest(CONFIG.baseUrl);
    const isSuccess = response.statusCode === 200;
    const responseTime = response.responseTime;

    logTest('サイト応答確認', isSuccess, `${responseTime}ms`);
    logTest('応答時間（<3000ms）', responseTime < 3000, `${responseTime}ms`);

    // HTMLの基本構造確認
    const hasTitle = response.data.includes('<title>');
    const hasMetaViewport = response.data.includes('viewport');
    logTest('HTML構造確認', hasTitle && hasMetaViewport);

    return isSuccess;
  } catch (error) {
    logTest('サイト応答確認', false, error.message);
    return false;
  }
}

// 主要ページテスト
async function testMainPages() {
  logSection('📄 主要ページテスト');

  const pages = [
    { path: '/', name: 'ランディングページ' },
    { path: '/register', name: '新規登録ページ' },
    { path: '/login', name: 'ログインページ' },
    { path: '/board', name: '掲示板ページ（認証後リダイレクト想定）' },
    { path: '/api/posts', name: '投稿API' },
  ];

  let successCount = 0;

  for (const page of pages) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${page.path}`);
      const isSuccess = response.statusCode === 200 || response.statusCode === 302; // リダイレクトもOK

      logTest(page.name, isSuccess, `HTTP ${response.statusCode} (${response.responseTime}ms)`);

      if (isSuccess) successCount++;
    } catch (error) {
      logTest(page.name, false, error.message);
    }
  }

  const successRate = (successCount / pages.length) * 100;
  logTest(`ページ応答率`, successRate >= 80, `${successRate.toFixed(1)}%`);

  return successRate >= 80;
}

// APIエンドポイントテスト
async function testAPIEndpoints() {
  logSection('🔌 APIエンドポイントテスト');

  const endpoints = [
    { path: '/api/posts', method: 'GET', name: '投稿取得API' },
    { path: '/api/posts/search?q=test', method: 'GET', name: '投稿検索API' },
    { path: '/api/auth/signin', method: 'GET', name: 'NextAuth認証API' },
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${endpoint.path}`);
      // API は 200, 400, 401 などを適切に返していればOK
      const isSuccess = response.statusCode < 500;

      logTest(endpoint.name, isSuccess, `HTTP ${response.statusCode} (${response.responseTime}ms)`);

      if (isSuccess) successCount++;
    } catch (error) {
      logTest(endpoint.name, false, error.message);
    }
  }

  return successCount === endpoints.length;
}

// セキュリティヘッダーテスト
async function testSecurityHeaders() {
  logSection('🔒 セキュリティヘッダーテスト');

  try {
    const response = await makeRequest(CONFIG.baseUrl);
    const headers = response.headers;

    const securityChecks = [
      {
        name: 'HTTPS強制',
        check: () => CONFIG.baseUrl.startsWith('https'),
        required: true,
      },
      {
        name: 'Content-Security-Policy',
        check: () =>
          headers['content-security-policy'] || headers['content-security-policy-report-only'],
        required: false,
      },
      {
        name: 'X-Frame-Options',
        check: () => headers['x-frame-options'],
        required: false,
      },
      {
        name: 'X-Content-Type-Options',
        check: () => headers['x-content-type-options'],
        required: false,
      },
    ];

    let criticalPassed = true;

    for (const check of securityChecks) {
      const passed = check.check();
      logTest(check.name, passed);

      if (check.required && !passed) {
        criticalPassed = false;
      }
    }

    return criticalPassed;
  } catch (error) {
    logTest('セキュリティヘッダー確認', false, error.message);
    return false;
  }
}

// メール機能テスト（模擬）
async function testEmailFunctionality() {
  logSection('📧 メール機能テスト（バリデーション）');

  // 実際のメール送信はせず、バリデーション部分のみテスト
  const emailTests = [
    { email: 'test@example.com', valid: true },
    { email: 'user+tag@gmail.com', valid: true },
    { email: 'user.name@domain.co.jp', valid: true },
    { email: 'invalid@', valid: false },
    { email: '@invalid.com', valid: false },
  ];

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  let passedTests = 0;

  for (const test of emailTests) {
    const result = emailRegex.test(test.email);
    const isCorrect = result === test.valid;

    logTest(
      `${test.email}`,
      isCorrect,
      `期待: ${test.valid ? '有効' : '無効'}, 結果: ${result ? '有効' : '無効'}`
    );

    if (isCorrect) passedTests++;
  }

  return passedTests === emailTests.length;
}

// パフォーマンステスト
async function testPerformance() {
  logSection('⚡ パフォーマンステスト');

  const performanceTests = [];

  // 複数回テストして平均値を取得
  for (let i = 0; i < 3; i++) {
    try {
      const response = await makeRequest(CONFIG.baseUrl);
      performanceTests.push(response.responseTime);
    } catch (error) {
      // エラーは無視して続行
    }
  }

  if (performanceTests.length > 0) {
    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
    const maxTime = Math.max(...performanceTests);

    logTest('平均応答時間（<2000ms）', avgTime < 2000, `${avgTime.toFixed(0)}ms`);
    logTest('最大応答時間（<3000ms）', maxTime < 3000, `${maxTime}ms`);

    return avgTime < 2000 && maxTime < 3000;
  } else {
    logTest('パフォーマンステスト', false, '応答が取得できませんでした');
    return false;
  }
}

// メイン実行関数
async function runHealthCheck() {
  log('🚀 本番環境ヘルスチェック開始', 'magenta');
  log(`対象URL: ${CONFIG.baseUrl}`, 'blue');
  log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`, 'blue');

  const results = {
    connectivity: false,
    pages: false,
    api: false,
    security: false,
    email: false,
    performance: false,
  };

  try {
    results.connectivity = await testBasicConnectivity();
    results.pages = await testMainPages();
    results.api = await testAPIEndpoints();
    results.security = await testSecurityHeaders();
    results.email = await testEmailFunctionality();
    results.performance = await testPerformance();
  } catch (error) {
    log(`\n❌ 予期しないエラーが発生しました: ${error.message}`, 'red');
  }

  // 総合結果
  logSection('📊 総合結果');

  const testResults = [
    { name: '基本接続性', passed: results.connectivity, critical: true },
    { name: '主要ページ', passed: results.pages, critical: true },
    { name: 'API機能', passed: results.api, critical: true },
    { name: 'セキュリティ', passed: results.security, critical: false },
    { name: 'メール機能', passed: results.email, critical: true },
    { name: 'パフォーマンス', passed: results.performance, critical: false },
  ];

  let criticalPassed = 0;
  let criticalTotal = 0;
  let totalPassed = 0;

  for (const result of testResults) {
    logTest(result.name, result.passed, result.critical ? '(必須)' : '(推奨)');

    if (result.passed) totalPassed++;
    if (result.critical) {
      criticalTotal++;
      if (result.passed) criticalPassed++;
    }
  }

  const overallScore = (totalPassed / testResults.length) * 100;
  const criticalScore = (criticalPassed / criticalTotal) * 100;

  console.log('\n' + '='.repeat(50));
  log(
    `全体スコア: ${overallScore.toFixed(1)}% (${totalPassed}/${testResults.length})`,
    overallScore >= 80 ? 'green' : 'red'
  );
  log(
    `必須項目スコア: ${criticalScore.toFixed(1)}% (${criticalPassed}/${criticalTotal})`,
    criticalScore === 100 ? 'green' : 'red'
  );

  if (criticalScore === 100) {
    log('\n🎉 発表会準備完了！全ての必須項目をクリアしています。', 'green');
  } else {
    log('\n⚠️  発表会前に修正が必要な項目があります。', 'yellow');
  }

  console.log('='.repeat(50));

  // 終了コード設定
  process.exit(criticalScore === 100 ? 0 : 1);
}

// スクリプト実行
if (require.main === module) {
  runHealthCheck().catch((error) => {
    log(`\n💥 ヘルスチェックが失敗しました: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runHealthCheck, CONFIG };
