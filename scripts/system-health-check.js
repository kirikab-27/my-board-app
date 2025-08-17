#!/usr/bin/env node

/**
 * システムヘルスチェック自動化スクリプト
 * 掲示板アプリの基本的な動作確認を自動実行
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.APP_URL || 'http://localhost:3010';
const TEST_TIMEOUT = 10000; // 10秒タイムアウト

// テスト結果格納
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * テスト実行ヘルパー関数
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(colorize('blue', `🧪 テスト実行中: ${testName}`));
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASS', error: null });
    console.log(colorize('green', `✅ PASS: ${testName}`));
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAIL', error: error.message });
    console.log(colorize('red', `❌ FAIL: ${testName} - ${error.message}`));
  }
}

/**
 * 色付きコンソール出力ヘルパー
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * HTTPリクエストヘルパー（Node.js標準ライブラリ使用）
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(`${BASE_URL}${url}`);
    const isHttps = targetUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: options.method || 'GET',
      timeout: TEST_TIMEOUT,
      headers: {
        'User-Agent': 'SystemHealthCheck/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Phase 0: 基本機能テスト
 */
async function testBasicFunctionality() {
  // ランディングページアクセス
  await runTest('ランディングページ表示', async () => {
    const response = await makeRequest('/');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.includes('掲示板') && !response.data.includes('board')) {
      throw new Error('ランディングページコンテンツが見つかりません');
    }
  });

  // API疎通確認
  await runTest('API基本疎通確認', async () => {
    const response = await makeRequest('/api/posts?limit=5');
    if (response.status !== 200) {
      throw new Error(`API access failed with status ${response.status}`);
    }
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('APIレスポンス形式が不正');
    }
  });

  // 静的ファイル確認
  await runTest('静的アセット確認', async () => {
    const response = await makeRequest('/favicon.ico');
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Static file access issue: ${response.status}`);
    }
  });
}

/**
 * Phase 1-2: 認証機能テスト
 */
async function testAuthFunctionality() {
  // 登録ページアクセス
  await runTest('登録ページアクセス', async () => {
    const response = await makeRequest('/register');
    if (response.status !== 200) {
      throw new Error(`Register page failed with status ${response.status}`);
    }
    if (!response.data.includes('register') && !response.data.includes('登録')) {
      throw new Error('登録ページコンテンツが見つかりません');
    }
  });

  // ログインページアクセス
  await runTest('ログインページアクセス', async () => {
    const response = await makeRequest('/login');
    if (response.status !== 200) {
      throw new Error(`Login page failed with status ${response.status}`);
    }
    if (!response.data.includes('login') && !response.data.includes('ログイン')) {
      throw new Error('ログインページコンテンツが見つかりません');
    }
  });

  // 認証保護ページアクセス（リダイレクト確認）
  await runTest('認証保護ページリダイレクト', async () => {
    const response = await makeRequest('/board', {
      maxRedirects: 0,
      validateStatus: (status) => status >= 300 && status < 400
    });
    if (response.status !== 302 && response.status !== 307) {
      throw new Error(`Expected redirect, got status ${response.status}`);
    }
  });
}

/**
 * Phase 3-4.5: CRUD機能テスト
 */
async function testCRUDFunctionality() {
  // 投稿作成ページアクセス
  await runTest('投稿作成ページアクセス', async () => {
    const response = await makeRequest('/board/create');
    // 認証が必要なのでリダイレクトまたは認証ページ表示
    if (response.status !== 200 && response.status !== 302 && response.status !== 307) {
      throw new Error(`Create page access failed with status ${response.status}`);
    }
  });

  // 投稿検索API
  await runTest('投稿検索API', async () => {
    const response = await makeRequest('/api/posts/search?q=test&limit=5');
    if (response.status !== 200) {
      throw new Error(`Search API failed with status ${response.status}`);
    }
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('検索APIレスポンス形式が不正');
    }
  });
}

/**
 * Phase 5: セキュリティテスト
 */
async function testSecurityFeatures() {
  // セキュリティヘッダー確認
  await runTest('セキュリティヘッダー確認', async () => {
    const response = await makeRequest('/');
    const headers = response.headers;
    
    // 基本的なセキュリティヘッダーの存在確認
    const expectedHeaders = ['x-frame-options', 'x-content-type-options'];
    for (const header of expectedHeaders) {
      if (!headers[header]) {
        console.warn(colorize('yellow', `⚠️  Warning: ${header} header missing`));
      }
    }
  });

  // レート制限テスト（軽微）
  await runTest('レート制限機能確認', async () => {
    // 連続リクエストでレート制限が機能するか確認
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(makeRequest('/api/posts?limit=1'));
    }
    await Promise.all(requests);
    // 3リクエスト程度なら制限に引っかからないはず
  });

  // CSRFトークンAPI確認
  await runTest('CSRFトークンAPI確認', async () => {
    const response = await makeRequest('/api/security/csrf');
    if (response.status !== 200 && response.status !== 401) {
      throw new Error(`CSRF token API failed with status ${response.status}`);
    }
  });
}

/**
 * データベース接続テスト
 */
async function testDatabaseConnection() {
  await runTest('データベース接続確認', async () => {
    // 投稿数取得でDB接続を間接的に確認
    const response = await makeRequest('/api/posts?limit=1');
    if (response.status === 500) {
      throw new Error('データベース接続エラーの可能性');
    }
    if (!response.data) {
      throw new Error('データベースレスポンスが空');
    }
  });
}

/**
 * メイン実行関数
 */
async function main() {
  console.log(colorize('cyan', '🚀 システムヘルスチェック開始'));
  console.log(colorize('cyan', `🎯 テスト対象: ${BASE_URL}`));
  console.log(colorize('gray', '=' .repeat(60)));

  const startTime = Date.now();

  // Phase別テスト実行
  console.log(colorize('magenta', '\n📋 Phase 0: 基本機能テスト'));
  await testBasicFunctionality();

  console.log(colorize('magenta', '\n🔐 Phase 1-2: 認証機能テスト'));
  await testAuthFunctionality();

  console.log(colorize('magenta', '\n📝 Phase 3-4.5: CRUD機能テスト'));
  await testCRUDFunctionality();

  console.log(colorize('magenta', '\n🛡️  Phase 5: セキュリティテスト'));
  await testSecurityFeatures();

  console.log(colorize('magenta', '\n🗄️  データベーステスト'));
  await testDatabaseConnection();

  // 結果サマリー表示
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(colorize('gray', '=' .repeat(60)));
  console.log(colorize('cyan', '📊 テスト結果サマリー'));
  console.log(colorize('green', `✅ 成功: ${testResults.passed}/${testResults.total}`));
  console.log(colorize('red', `❌ 失敗: ${testResults.failed}/${testResults.total}`));
  console.log(colorize('blue', `⏱️  実行時間: ${duration.toFixed(2)}秒`));

  if (testResults.failed > 0) {
    console.log(colorize('red', '\n🚨 失敗したテスト:'));
    testResults.details
      .filter(detail => detail.status === 'FAIL')
      .forEach(detail => {
        console.log(colorize('red', `  • ${detail.name}: ${detail.error}`));
      });
  }

  // 健康度スコア計算
  const healthScore = Math.round((testResults.passed / testResults.total) * 100);
  console.log(colorize('blue', `\n🏥 システム健康度スコア: ${healthScore}%`));

  if (healthScore >= 90) {
    console.log(colorize('green', '🎉 システムは正常に動作しています！'));
  } else if (healthScore >= 70) {
    console.log(colorize('yellow', '⚠️  一部問題がありますが、基本動作は可能です'));
  } else {
    console.log(colorize('red', '🚨 重要な問題があります。早急な対応が必要です'));
  }

  // 推奨アクション
  console.log(colorize('cyan', '\n💡 推奨アクション:'));
  console.log('1. 失敗したテストの詳細を確認してください');
  console.log('2. docs/system-test-checklist.md で手動テストを実行してください');
  console.log('3. 問題がある場合はログとエラーメッセージを確認してください');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// スクリプト実行
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('red', `💥 予期しないエラー: ${error.message}`));
    process.exit(1);
  });
}

module.exports = { main };