#!/usr/bin/env node

/**
 * 認証保護API テストスクリプト
 * 
 * 実行方法:
 * node scripts/test-auth-apis.js
 * 
 * テスト内容:
 * - POST /api/posts（投稿作成）の認証保護確認
 * - PUT /api/posts/[id]（投稿編集）の認証保護と本人確認
 * - DELETE /api/posts/[id]（投稿削除）の認証保護と本人確認
 * - POST/DELETE /api/posts/[id]/like（いいね機能）の動作確認
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.APP_URL || 'http://localhost:3010';

async function makeRequest(method, url, data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      success: false
    };
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 認証なしアクセステスト');
  console.log('========================');
  
  // 投稿作成（認証必須）
  console.log('1. POST /api/posts（認証なし）');
  const createResult = await makeRequest('POST', `${BASE_URL}/api/posts`, {
    content: 'テスト投稿（認証なし）'
  });
  
  if (createResult.status === 401) {
    console.log('   ✅ 正常: 401 Unauthorized');
  } else {
    console.log(`   ❌ 異常: ${createResult.status} - ${createResult.statusText}`);
  }
  
  // 投稿編集（認証必須）
  console.log('2. PUT /api/posts/invalid_id（認証なし）');
  const editResult = await makeRequest('PUT', `${BASE_URL}/api/posts/507f1f77bcf86cd799439011`, {
    content: 'テスト編集（認証なし）'
  });
  
  if (editResult.status === 401) {
    console.log('   ✅ 正常: 401 Unauthorized');
  } else {
    console.log(`   ❌ 異常: ${editResult.status} - ${editResult.statusText}`);
  }
  
  // 投稿削除（認証必須）
  console.log('3. DELETE /api/posts/invalid_id（認証なし）');
  const deleteResult = await makeRequest('DELETE', `${BASE_URL}/api/posts/507f1f77bcf86cd799439011`);
  
  if (deleteResult.status === 401) {
    console.log('   ✅ 正常: 401 Unauthorized');
  } else {
    console.log(`   ❌ 異常: ${deleteResult.status} - ${deleteResult.statusText}`);
  }
  
  console.log('');
}

async function testPublicAccess() {
  console.log('🌐 公開アクセステスト');
  console.log('====================');
  
  // 投稿一覧取得（公開）
  console.log('1. GET /api/posts（公開）');
  const listResult = await makeRequest('GET', `${BASE_URL}/api/posts?limit=5`);
  
  if (listResult.success) {
    console.log(`   ✅ 正常: ${listResult.status} - ${listResult.data.posts ? listResult.data.posts.length : 0}件の投稿を取得`);
  } else {
    console.log(`   ❌ 異常: ${listResult.status} - ${listResult.statusText}`);
  }
  
  // いいね状態確認（公開・認証なし）
  if (listResult.success && listResult.data.posts && listResult.data.posts.length > 0) {
    const firstPost = listResult.data.posts[0];
    console.log(`2. GET /api/posts/${firstPost._id}/like（公開・認証なし）`);
    
    const likeStatusResult = await makeRequest('GET', `${BASE_URL}/api/posts/${firstPost._id}/like`);
    
    if (likeStatusResult.success) {
      console.log(`   ✅ 正常: ${likeStatusResult.status} - いいね数: ${likeStatusResult.data.likes}, 状態: ${likeStatusResult.data.liked}`);
    } else {
      console.log(`   ❌ 異常: ${likeStatusResult.status} - ${likeStatusResult.statusText}`);
    }
    
    // いいね追加（匿名ユーザー）
    console.log(`3. POST /api/posts/${firstPost._id}/like（匿名いいね）`);
    
    const addLikeResult = await makeRequest('POST', `${BASE_URL}/api/posts/${firstPost._id}/like`);
    
    if (addLikeResult.success || addLikeResult.status === 409) {
      console.log(`   ✅ 正常: ${addLikeResult.status} - ${addLikeResult.data.message || '既にいいね済み'}`);
    } else {
      console.log(`   ❌ 異常: ${addLikeResult.status} - ${addLikeResult.statusText}`);
    }
  }
  
  console.log('');
}

async function testInvalidRequests() {
  console.log('⚠️  無効リクエストテスト');
  console.log('========================');
  
  // 無効な投稿ID
  console.log('1. PUT /api/posts/invalid_id（無効ID）');
  const invalidIdResult = await makeRequest('PUT', `${BASE_URL}/api/posts/invalid_id`, {
    content: 'テスト'
  });
  
  if (invalidIdResult.status === 400 || invalidIdResult.status === 401) {
    console.log(`   ✅ 正常: ${invalidIdResult.status} - 無効IDまたは認証エラー`);
  } else {
    console.log(`   ❌ 異常: ${invalidIdResult.status} - ${invalidIdResult.statusText}`);
  }
  
  // 空の投稿内容
  console.log('2. POST /api/posts（空内容）');
  const emptyContentResult = await makeRequest('POST', `${BASE_URL}/api/posts`, {
    content: ''
  });
  
  if (emptyContentResult.status === 400 || emptyContentResult.status === 401) {
    console.log(`   ✅ 正常: ${emptyContentResult.status} - バリデーションエラーまたは認証エラー`);
  } else {
    console.log(`   ❌ 異常: ${emptyContentResult.status} - ${emptyContentResult.statusText}`);
  }
  
  // 長すぎる投稿内容
  console.log('3. POST /api/posts（201文字以上）');
  const longContentResult = await makeRequest('POST', `${BASE_URL}/api/posts`, {
    content: 'A'.repeat(201)
  });
  
  if (longContentResult.status === 400 || longContentResult.status === 401) {
    console.log(`   ✅ 正常: ${longContentResult.status} - バリデーションエラーまたは認証エラー`);
  } else {
    console.log(`   ❌ 異常: ${longContentResult.status} - ${longContentResult.statusText}`);
  }
  
  console.log('');
}

async function testServerHealth() {
  console.log('💚 サーバー稼働テスト');
  console.log('====================');
  
  console.log('1. サーバー接続確認');
  const healthResult = await makeRequest('GET', `${BASE_URL}/api/posts?limit=1`);
  
  if (healthResult.success) {
    console.log('   ✅ 正常: サーバーは稼働しています');
  } else if (healthResult.status === 0) {
    console.log('   ❌ 異常: サーバーに接続できません');
    return false;
  } else {
    console.log(`   ⚠️  警告: ${healthResult.status} - ${healthResult.statusText}`);
  }
  
  console.log('');
  return true;
}

async function main() {
  console.log('🧪 認証保護API テストスイート');
  console.log('================================');
  console.log(`テスト対象: ${BASE_URL}`);
  console.log('');
  
  // サーバー稼働確認
  const serverRunning = await testServerHealth();
  if (!serverRunning) {
    console.log('❌ サーバーが稼働していません。npm run dev でサーバーを起動してください。');
    process.exit(1);
  }
  
  // テスト実行
  await testUnauthorizedAccess();
  await testPublicAccess();
  await testInvalidRequests();
  
  console.log('🎉 テスト完了！');
  console.log('');
  console.log('📋 テスト結果の解釈:');
  console.log('- 認証が必要なAPIは 401 Unauthorized を返すべきです');
  console.log('- 公開APIは正常に動作するべきです');
  console.log('- 無効なリクエストは適切なエラー（400/401）を返すべきです');
  console.log('');
  console.log('🔧 詳細な認証テストを行うには:');
  console.log('1. ブラウザでログインしてください');
  console.log('2. 開発者ツールで投稿作成・編集・削除を試してください');
  console.log('3. 異なるユーザーで他人の投稿編集を試してください（403エラーになるべき）');
}

if (require.main === module) {
  // Node.js 18以降のfetch対応確認
  if (typeof fetch === 'undefined') {
    console.error('❌ このスクリプトにはNode.js 18以降が必要です（fetch API）');
    console.error('または npm install node-fetch を実行してください');
    process.exit(1);
  }
  
  main().catch(console.error);
}

module.exports = { makeRequest, testUnauthorizedAccess, testPublicAccess };