// タイムライン機能の簡単なテスト
// ブラウザで http://localhost:3010/timeline にアクセスしてテスト

console.log('📄 タイムライン機能テストガイド');
console.log('================================');
console.log('');
console.log('🚀 タイムライン機能をテストするには:');
console.log('');
console.log('1. 開発サーバーが起動していることを確認:');
console.log('   http://localhost:3010');
console.log('');
console.log('2. ユーザー登録またはログイン:');
console.log('   http://localhost:3010/login');
console.log('   または');
console.log('   http://localhost:3010/register');
console.log('');
console.log('3. ナビゲーションメニューから「タイムライン」をクリック');
console.log('   または直接アクセス: http://localhost:3010/timeline');
console.log('');
console.log('4. 他のユーザーをフォロー:');
console.log('   http://localhost:3010/users でユーザーを検索・フォロー');
console.log('');
console.log('5. 投稿を作成:');
console.log('   http://localhost:3010/board/create で新しい投稿を作成');
console.log('');
console.log('6. タイムラインで投稿とフォロー中ユーザーの投稿を確認');
console.log('');
console.log('✅ 期待される動作:');
console.log('- 自分の投稿が表示される');
console.log('- フォロー中ユーザーの投稿が表示される');
console.log('- 新しい順で投稿が並ぶ');
console.log('- 無限スクロールで過去の投稿を読み込み');
console.log('- いいね数・作成時間・フォロー状態が表示される');
console.log('');
console.log('🔧 トラブルシューティング:');
console.log('- 投稿が表示されない → 投稿作成・フォロー関係確認');
console.log('- 認証エラー → ログイン状態確認');
console.log('- API エラー → 開発者ツールのNetwork タブ確認');
console.log('');
console.log('🌐 開発者向けAPI直接テスト:');
console.log('認証が必要なので、ブラウザでログイン後にcookie付きで:');
console.log('GET http://localhost:3010/api/timeline?page=1&limit=5');
console.log('');

// 現在のサーバー状態確認
fetch('http://localhost:3010/api/timeline', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => {
  console.log('📡 サーバー応答ステータス:', res.status);
  if (res.status === 401) {
    console.log('✅ 認証が必要（正常）- ブラウザでログインしてテストしてください');
  } else if (res.status === 200) {
    console.log('⚠️  認証なしでアクセス可能（要確認）');
  } else {
    console.log('❌ 予期しないレスポンス');
  }
})
.catch(err => {
  console.log('🔌 サーバー接続状態:', err.code === 'ECONNREFUSED' ? '❌ 停止中' : '✅ 起動中');
});