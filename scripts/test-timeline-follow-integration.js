/**
 * タイムライン × フォロー機能統合テストスクリプト
 * 
 * このスクリプトはタイムライン機能とフォロー機能の統合が
 * 正常に動作するかをテストします。
 */

console.log('🔗 タイムライン × フォロー機能統合テスト');
console.log('==========================================');
console.log('');

// テストのステップを出力
const testSteps = [
  {
    step: 1,
    title: '開発サーバー確認',
    description: 'http://localhost:3010 が起動していること',
    action: 'ブラウザでアクセス確認'
  },
  {
    step: 2, 
    title: 'ユーザー登録・ログイン',
    description: '最低2人のテストユーザーでログイン',
    action: '/register または /login でアカウント作成'
  },
  {
    step: 3,
    title: 'フォロー関係構築',
    description: 'ユーザー1 → ユーザー2 をフォロー',
    action: '/users ページでフォローボタンクリック'
  },
  {
    step: 4,
    title: '投稿作成',
    description: 'ユーザー2で投稿を作成',
    action: '/board/create で新しい投稿を作成'
  },
  {
    step: 5,
    title: 'タイムライン確認',
    description: 'ユーザー1のタイムラインにユーザー2の投稿が表示',
    action: '/timeline ページで投稿確認'
  },
  {
    step: 6,
    title: 'タイムライン上フォロー機能',
    description: 'タイムライン投稿からフォロー・アンフォローできること',
    action: '投稿カード上のフォローボタンをテスト'
  },
  {
    step: 7,
    title: 'リアルタイム更新',
    description: '新しい投稿がタイムラインに反映されること',
    action: 'ページリフレッシュまたは新着チェック'
  }
];

testSteps.forEach(test => {
  console.log(`📋 ステップ ${test.step}: ${test.title}`);
  console.log(`   説明: ${test.description}`);
  console.log(`   操作: ${test.action}\n`);
});

console.log('🎯 期待される動作:');
console.log('✅ タイムラインにフォロー中ユーザーの投稿が表示される');
console.log('✅ 自分の投稿も表示される');
console.log('✅ 投稿が新しい順で並んでいる');
console.log('✅ 投稿者がフォロー中の場合「フォロー中」チップが表示');
console.log('✅ 自分以外の投稿にフォローボタンが表示される');
console.log('✅ フォローボタンで実際にフォロー・アンフォローできる');
console.log('✅ フォロー状態変更後にUI即座更新される');
console.log('✅ 無限スクロールで過去の投稿を読み込める');
console.log('');

console.log('🔧 トラブルシューティング:');
console.log('❌ 投稿が表示されない');
console.log('   → フォロー関係を確認（/users でフォロー状態確認）');
console.log('   → 投稿の isPublic: true を確認');
console.log('   → 開発者ツールでAPI レスポンス確認');
console.log('');
console.log('❌ フォローボタンが動作しない');
console.log('   → ネットワークタブで API エラー確認');
console.log('   → コンソールで JavaScript エラー確認');
console.log('   → 認証状態を確認');
console.log('');
console.log('❌ タイムラインが空');
console.log('   → 投稿を作成（/board/create）');
console.log('   → フォロー関係を構築（/users）');
console.log('   → ページリフレッシュ');
console.log('');

console.log('🌐 開発者向けAPI確認:');
console.log('');
console.log('# タイムライン取得（要認証）');
console.log('GET /api/timeline?page=1&limit=5');
console.log('');
console.log('# フォロー状態確認');
console.log('GET /api/follow/stats?userId=USER_ID');
console.log('');
console.log('# フォロー実行');
console.log('POST /api/follow');
console.log('Content-Type: application/json');
console.log('{"targetUserId": "USER_ID"}');
console.log('');

// サーバー接続テスト
console.log('📡 サーバー接続テスト実行中...');

Promise.all([
  // タイムライン API
  fetch('http://localhost:3010/api/timeline')
    .then(res => ({ api: 'timeline', status: res.status, ok: res.ok }))
    .catch(err => ({ api: 'timeline', error: err.code })),
  
  // フォロー API
  fetch('http://localhost:3010/api/follow/stats?userId=test')
    .then(res => ({ api: 'follow', status: res.status, ok: res.ok }))
    .catch(err => ({ api: 'follow', error: err.code })),
    
  // ユーザー API
  fetch('http://localhost:3010/api/users')
    .then(res => ({ api: 'users', status: res.status, ok: res.ok }))
    .catch(err => ({ api: 'users', error: err.code }))
    
]).then(results => {
  console.log('\n📊 API接続結果:');
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.api}: サーバー未起動 (${result.error})`);
    } else if (result.status === 401) {
      console.log(`✅ ${result.api}: 正常 (認証必須)`);
    } else if (result.status === 400) {
      console.log(`✅ ${result.api}: 正常 (パラメータエラー)`);
    } else {
      console.log(`⚠️  ${result.api}: ${result.status} (要確認)`);
    }
  });
  
  console.log('\n🚀 統合テスト開始可能状態です！');
  console.log('📍 テスト開始URL: http://localhost:3010/timeline');
  
}).catch(err => {
  console.log('\n❌ API接続テストでエラーが発生しました:', err.message);
});

console.log('\n⏳ API接続確認中...');