/**
 * 認証フローデバッグスクリプト
 * 現在のセッション状態とミドルウェア動作を確認
 */

const BASE_URL = 'http://localhost:3010';

async function debugAuthFlow() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🔍 認証フローデバッグ開始\n');
  console.log('=' * 50);
  
  // テストケース
  const testCases = [
    {
      name: 'パスワードリセットページ（未認証）',
      path: '/auth/reset-password?token=test123',
      cookies: ''
    },
    {
      name: 'パスワード忘れページ（未認証）',
      path: '/auth/forgot-password',
      cookies: ''
    },
    {
      name: 'プロフィールページ（未認証）',
      path: '/profile',
      cookies: ''
    },
    {
      name: '掲示板ページ（未認証）',
      path: '/board',
      cookies: ''
    },
    {
      name: 'ダッシュボード（未認証）',
      path: '/dashboard',
      cookies: ''
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📍 ${testCase.name}`);
    console.log(`   パス: ${testCase.path}`);
    
    try {
      const response = await fetch(`${BASE_URL}${testCase.path}`, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Cookie': testCase.cookies
        }
      });
      
      const status = response.status;
      const location = response.headers.get('location');
      
      console.log(`   ステータス: ${status}`);
      
      if (status === 200) {
        console.log('   ✅ 正常アクセス（ページ表示）');
      } else if (status === 302 || status === 307 || status === 308) {
        console.log(`   🔄 リダイレクト → ${location}`);
        
        // リダイレクト先を判定
        if (location) {
          if (location.includes('/login')) {
            console.log('   　→ ログインページ（認証必須）');
          } else if (location.includes('/dashboard')) {
            console.log('   　→ ダッシュボード（認証済み扱い）');
          } else if (location.includes('/board')) {
            console.log('   　→ 掲示板（認証済み扱い）');
          } else if (location.includes('/auth/verify-email')) {
            console.log('   　→ メール認証ページ（メール未認証）');
          }
        }
      } else {
        console.log(`   ❓ 予期しないステータス`);
      }
    } catch (error) {
      console.log(`   ❌ エラー: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' * 50);
  console.log('\n📊 問題の診断:');
  
  console.log('\n1. パスワードリセットページの問題:');
  console.log('   - 期待: 未認証でもアクセス可能（公開ルート）');
  console.log('   - 現在の設定: public配列に追加済み');
  console.log('   - 確認事項: ミドルウェアがリロードされているか');
  
  console.log('\n2. プロフィールページの問題:');
  console.log('   - 期待: 認証必須 → ログインページへ');
  console.log('   - 現在の設定: requireEmailVerified: true');
  console.log('   - 問題: メール未認証の場合、verify-emailへリダイレクト');
  
  console.log('\n3. 推奨される修正:');
  console.log('   - 開発サーバーの完全再起動');
  console.log('   - ブラウザのキャッシュクリア');
  console.log('   - セッションクッキーの削除');
  
  console.log('\n💡 ブラウザでの確認方法:');
  console.log('1. F12で開発者ツールを開く');
  console.log('2. Application/Storageタブ → Cookies');
  console.log('3. next-auth関連のクッキーを削除');
  console.log('4. ページを再読み込み');
}

// 実行
debugAuthFlow().catch(console.error);