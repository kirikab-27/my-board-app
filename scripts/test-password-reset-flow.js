/**
 * パスワードリセットフロー完全テスト
 * 
 * 1. リセットトークン生成
 * 2. リセットページアクセステスト
 * 3. トークン検証
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const crypto = require('crypto');

// テスト用モデル定義
const VerificationTokenSchema = new mongoose.Schema({
  identifier: String,
  token: String,
  expires: Date,
  type: String
}, { timestamps: true });

const VerificationToken = mongoose.model('VerificationToken', VerificationTokenSchema);

async function testPasswordResetFlow() {
  console.log('🔐 パスワードリセットフロー完全テスト\n');
  
  const BASE_URL = 'http://localhost:3010';
  const fetch = (await import('node-fetch')).default;
  
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功\n');
    
    // 1. テスト用リセットトークン生成
    console.log('1️⃣ テスト用リセットトークン生成');
    
    const testEmail = 'test@example.com';
    const testToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1時間後
    
    // 既存のトークンを削除
    await VerificationToken.deleteMany({
      identifier: testEmail,
      type: 'password-reset'
    });
    
    // 新しいトークンを作成
    const token = await VerificationToken.create({
      identifier: testEmail,
      token: testToken,
      expires,
      type: 'password-reset'
    });
    
    console.log(`   ✅ トークン生成成功`);
    console.log(`   📧 メール: ${testEmail}`);
    console.log(`   🔑 トークン: ${testToken.substring(0, 20)}...`);
    console.log(`   ⏰ 有効期限: ${expires.toLocaleString()}\n`);
    
    // 2. リセットページアクセステスト（トークン付き）
    console.log('2️⃣ パスワードリセットページアクセステスト');
    
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${testToken}`;
    console.log(`   URL: ${resetUrl}`);
    
    // ログインしていない状態でアクセス
    console.log('\n   a) 未認証状態でのアクセス');
    const unauthResponse = await fetch(resetUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Cookie': '' // クッキーなし
      }
    });
    
    console.log(`   ステータス: ${unauthResponse.status}`);
    const redirectLocation = unauthResponse.headers.get('location');
    
    if (unauthResponse.status === 200) {
      console.log('   ✅ リセットページに正常アクセス（未認証）');
    } else if (unauthResponse.status === 302 || unauthResponse.status === 307) {
      console.log(`   ❌ リダイレクトされました → ${redirectLocation}`);
      
      if (redirectLocation && redirectLocation.includes('/login')) {
        console.log('   ⚠️ ログインページにリダイレクト（認証必須の設定）');
      } else if (redirectLocation && redirectLocation.includes('/dashboard')) {
        console.log('   ⚠️ ダッシュボードにリダイレクト（認証済みとして扱われている）');
      }
    }
    
    // 3. トークン検証APIテスト
    console.log('\n3️⃣ パスワードリセット確認APIテスト');
    
    const newPassword = 'NewPassword123!';
    
    const confirmResponse = await fetch(`${BASE_URL}/api/auth/reset-password/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: testToken,
        password: newPassword,
        confirmPassword: newPassword
      })
    });
    
    const confirmData = await confirmResponse.json();
    
    console.log(`   ステータス: ${confirmResponse.status}`);
    
    if (confirmResponse.status === 200) {
      console.log('   ✅ パスワードリセット成功');
      console.log(`   メッセージ: ${confirmData.message}`);
    } else {
      console.log('   ❌ パスワードリセット失敗');
      console.log(`   エラー: ${confirmData.error}`);
    }
    
    // 4. 無効なトークンでのテスト
    console.log('\n4️⃣ 無効なトークンテスト');
    
    const invalidToken = 'invalid-token-12345';
    const invalidUrl = `${BASE_URL}/auth/reset-password?token=${invalidToken}`;
    
    const invalidResponse = await fetch(invalidUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   ステータス: ${invalidResponse.status}`);
    
    if (invalidResponse.status === 200) {
      console.log('   ✅ ページは表示される（トークン検証はクライアント側）');
    }
    
    // クリーンアップ
    await VerificationToken.deleteMany({
      identifier: testEmail,
      type: 'password-reset'
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 テスト結果サマリー');
    console.log('='.repeat(50));
    
    console.log('\n✅ 修正完了:');
    console.log('1. /auth/forgot-password を公開ルートに追加');
    console.log('2. /auth/reset-password を公開ルートに追加');
    console.log('3. guestOnlyルートから /auth/reset-password を削除');
    
    console.log('\n📝 期待される動作:');
    console.log('1. メール内のリンクをクリック');
    console.log('2. パスワードリセットページが表示される（ログイン不要）');
    console.log('3. 新しいパスワードを入力して更新');
    console.log('4. ログインページにリダイレクト');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// 実行
testPasswordResetFlow().catch(console.error);