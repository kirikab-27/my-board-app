/**
 * パスワードリセット機能テストスクリプト
 * 
 * 以下を確認:
 * 1. /auth/forgot-password ページアクセス
 * 2. パスワードリセット要求API
 * 3. メール送信確認
 */

require('dotenv').config({ path: '.env.local' });

async function testPasswordReset() {
  console.log('🔐 パスワードリセット機能テスト開始\n');
  
  const BASE_URL = 'http://localhost:3010';
  const fetch = (await import('node-fetch')).default;
  
  // 1. パスワード忘れページアクセステスト
  console.log('1️⃣ /auth/forgot-password ページアクセステスト');
  try {
    const pageResponse = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   ステータス: ${pageResponse.status}`);
    console.log(`   リダイレクト: ${pageResponse.headers.get('location') || 'なし'}`);
    
    if (pageResponse.status === 200) {
      console.log('   ✅ ページアクセス成功');
    } else if (pageResponse.status === 302 || pageResponse.status === 307) {
      console.log(`   ⚠️ リダイレクトされました → ${pageResponse.headers.get('location')}`);
      console.log('   💡 /auth/forgot-password が認証必須になっている可能性があります');
    } else {
      console.log(`   ❌ 予期しないステータス: ${pageResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ エラー: ${error.message}`);
  }
  
  // 2. パスワードリセット要求APIテスト
  console.log('\n2️⃣ パスワードリセット要求APIテスト');
  
  const testEmails = [
    { email: 'test@example.com', description: '既存ユーザー（仮定）' },
    { email: 'nonexistent@example.com', description: '存在しないユーザー' },
    { email: 'invalid-email', description: '無効なメール形式' }
  ];
  
  for (const testCase of testEmails) {
    console.log(`\n   テスト: ${testCase.description}`);
    console.log(`   メール: ${testCase.email}`);
    
    try {
      const apiResponse = await fetch(`${BASE_URL}/api/auth/reset-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testCase.email })
      });
      
      const responseData = await apiResponse.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = { raw: responseData };
      }
      
      console.log(`   ステータス: ${apiResponse.status}`);
      
      if (apiResponse.status === 200) {
        console.log('   ✅ APIリクエスト成功');
        console.log(`   メッセージ: ${parsedData.message || '(なし)'}`);
      } else if (apiResponse.status === 400) {
        console.log('   ⚠️ バリデーションエラー');
        console.log(`   エラー: ${parsedData.error || responseData}`);
      } else if (apiResponse.status === 500) {
        console.log('   ❌ サーバーエラー');
        console.log(`   エラー: ${parsedData.error || responseData}`);
        
        // 詳細エラー確認
        if (parsedData.details) {
          console.log(`   詳細: ${parsedData.details}`);
        }
      } else {
        console.log(`   ❓ 予期しないステータス: ${apiResponse.status}`);
        console.log(`   レスポンス: ${responseData.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ リクエストエラー: ${error.message}`);
    }
  }
  
  // 3. SMTP設定確認
  console.log('\n3️⃣ SMTP設定確認');
  const smtpVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'MAIL_FROM_ADDRESS'
  ];
  
  let smtpConfigured = true;
  for (const varName of smtpVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: 設定済み`);
    } else {
      console.log(`   ❌ ${varName}: 未設定`);
      smtpConfigured = false;
    }
  }
  
  if (!smtpConfigured) {
    console.log('\n   ⚠️ SMTP設定が不完全です。.env.localファイルを確認してください。');
  }
  
  // 4. データベース接続確認
  console.log('\n4️⃣ データベース接続確認');
  const mongoose = require('mongoose');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB接続成功');
    
    // Userコレクション確認
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      name: String
    }));
    
    const userCount = await User.countDocuments();
    console.log(`   📊 ユーザー数: ${userCount}`);
    
    // テストユーザー存在確認
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      console.log(`   ✅ テストユーザー存在: ${testUser.name || testUser.email}`);
    } else {
      console.log('   ℹ️ test@example.com は存在しません');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`   ❌ データベースエラー: ${error.message}`);
  }
  
  // サマリー
  console.log('\n' + '='.repeat(50));
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log('\n💡 確認事項:');
  console.log('1. /auth/forgot-password ページがアクセス可能か');
  console.log('2. パスワードリセットAPIが正常に動作するか');
  console.log('3. SMTP設定が正しく設定されているか');
  console.log('4. データベース接続が正常か');
  
  console.log('\n🔧 問題がある場合の対処:');
  console.log('- ページアクセス不可 → middleware.ts の設定確認');
  console.log('- API 500エラー → SMTP設定・DB接続確認');
  console.log('- メール未送信 → SMTPサーバー設定・認証情報確認');
}

// 実行
testPasswordReset().catch(console.error);