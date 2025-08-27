/**
 * フォロー機能動作テストスクリプト
 * Phase 6.1 - フォロー機能とタイムライン統合テスト
 */

const { execSync } = require('child_process');
const fs = require('fs');

// テスト結果記録
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// テスト結果記録関数
function recordTest(name, status, details = null) {
  const test = {
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.tests.push(test);
  testResults.summary.total++;
  if (status === 'PASS') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  console.log(`${statusIcon} ${name}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// APIテスト実行関数
async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const url = `http://localhost:3010${endpoint}`;
    const curlCmd = method === 'GET' 
      ? `curl -s "${url}"` 
      : `curl -s -X ${method} -H "Content-Type: application/json" ${data ? `-d '${JSON.stringify(data)}'` : ''} "${url}"`;
    
    const response = execSync(curlCmd, { encoding: 'utf8' });
    return JSON.parse(response);
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

async function runFollowTests() {
  console.log('🚀 フォロー機能動作テスト開始\n');

  // 1. API エンドポイント存在確認
  console.log('📋 Phase 1: API エンドポイント存在確認');
  
  const requiredEndpoints = [
    '/api/follow',
    '/api/follow/requests', 
    '/api/follow/stats',
    '/api/timeline'
  ];

  for (const endpoint of requiredEndpoints) {
    try {
      const result = await testAPI(endpoint);
      if (result.error && result.error.includes('認証が必要')) {
        recordTest(`API存在確認: ${endpoint}`, 'PASS', '認証エラー（期待される動作）');
      } else {
        recordTest(`API存在確認: ${endpoint}`, 'PASS', 'エンドポイント応答確認');
      }
    } catch (error) {
      recordTest(`API存在確認: ${endpoint}`, 'FAIL', error.message);
    }
  }

  // 2. Followモデル存在確認
  console.log('\n📋 Phase 2: Followモデル確認');
  
  const followModelPath = 'src/models/Follow.ts';
  if (fs.existsSync(followModelPath)) {
    const content = fs.readFileSync(followModelPath, 'utf8');
    
    // 必要フィールド確認
    const requiredFields = [
      'follower',
      'following', 
      'status',
      'isAccepted',
      'isPending'
    ];
    
    const missingFields = requiredFields.filter(field => !content.includes(field));
    
    if (missingFields.length === 0) {
      recordTest('Followモデル構造確認', 'PASS', `全必須フィールド確認済み`);
    } else {
      recordTest('Followモデル構造確認', 'FAIL', `不足フィールド: ${missingFields.join(', ')}`);
    }
  } else {
    recordTest('Followモデル存在確認', 'FAIL', 'Follow.tsが見つかりません');
  }

  // 3. タイムラインAPIのフォロー統合確認
  console.log('\n📋 Phase 3: タイムライン・フォロー統合確認');
  
  const timelineApiPath = 'src/app/api/timeline/route.ts';
  if (fs.existsSync(timelineApiPath)) {
    const content = fs.readFileSync(timelineApiPath, 'utf8');
    
    // フォロー関連コード確認
    const followIntegrations = [
      'Follow.find',
      'follower:',
      'following:',
      'isAccepted: true'
    ];
    
    const missingIntegrations = followIntegrations.filter(pattern => !content.includes(pattern));
    
    if (missingIntegrations.length === 0) {
      recordTest('タイムライン・フォロー統合', 'PASS', 'フォロー機能統合確認済み');
    } else {
      recordTest('タイムライン・フォロー統合', 'FAIL', `未統合: ${missingIntegrations.join(', ')}`);
    }
  } else {
    recordTest('タイムラインAPI存在確認', 'FAIL', 'timeline/route.tsが見つかりません');
  }

  // 4. フォロー関連型定義確認
  console.log('\n📋 Phase 4: 型定義確認');
  
  const followTypePaths = [
    'src/models/Follow.ts',
    'src/types/follow.ts'
  ];
  
  let typeDefinitionFound = false;
  for (const path of followTypePaths) {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      if (content.includes('interface') && content.includes('Follow')) {
        recordTest(`型定義確認: ${path}`, 'PASS', 'Follow型定義確認');
        typeDefinitionFound = true;
        break;
      }
    }
  }
  
  if (!typeDefinitionFound) {
    recordTest('Follow型定義確認', 'FAIL', 'Follow型定義が見つかりません');
  }

  // 5. 開発サーバー起動確認
  console.log('\n📋 Phase 5: 開発サーバー確認');
  
  try {
    const healthCheck = await testAPI('/api/posts');
    recordTest('開発サーバー起動確認', 'PASS', 'サーバー正常応答');
  } catch (error) {
    recordTest('開発サーバー起動確認', 'FAIL', error.message);
  }

  // テスト結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log(`総テスト数: ${testResults.summary.total}`);
  console.log(`✅ 成功: ${testResults.summary.passed}`);
  console.log(`❌ 失敗: ${testResults.summary.failed}`);
  console.log(`成功率: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);

  // テスト結果ファイル保存
  const resultFile = `test-results-follow-${Date.now()}.json`;
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 詳細結果: ${resultFile}`);

  // 次のステップ提案
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 フォロー機能テスト完了！');
    console.log('次のステップ: タイムライン機能の統合テストを実行可能');
    console.log('実行コマンド: node scripts/test-timeline-integration.js');
  } else {
    console.log('\n⚠️  エラーがあります。修正が必要です。');
    console.log('失敗したテストを確認して修正してください。');
  }
}

// メイン実行
if (require.main === module) {
  runFollowTests().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { runFollowTests };