// 管理者権限付与スクリプト - 緊急対応
const { MongoClient } = require('mongodb');

async function grantAdminRole() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 MongoDB接続完了 - 管理者権限付与');
    
    const db = client.db();
    const users = db.collection('users');
    
    // 全ユーザーの現在の権限を確認
    console.log('\n📋 現在のユーザー権限:');
    const allUsers = await users.find({}).toArray();
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} - 権限: ${user.role || 'user'}`);
    });
    
    // メイン管理者権限付与
    const mainAdminEmails = [
      'kab27kav@gmail.com',
      'minomasa34@gmail.com'
    ];
    
    console.log('\n🔧 メイン管理者権限付与:');
    for (const email of mainAdminEmails) {
      const result = await users.updateOne(
        { email: email.toLowerCase() },
        { $set: { role: 'admin' } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ ${email} → admin権限付与`);
      } else {
        console.log(`⚠️ ${email} ユーザーが見つかりません`);
      }
    }
    
    // 全ユーザーに最低限の権限を付与（管理者機能テスト用）
    console.log('\n🔧 全ユーザーにmoderatorテスト権限付与:');
    const bulkResult = await users.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'moderator' } }
    );
    console.log(`✅ ${bulkResult.modifiedCount}名にmoderator権限付与`);
    
    // 最終確認
    console.log('\n📊 管理者権限付与完了:');
    const adminUsers = await users.find({ role: 'admin' }).toArray();
    const moderatorUsers = await users.find({ role: 'moderator' }).toArray();
    
    console.log(`管理者: ${adminUsers.length}名`);
    adminUsers.forEach(user => console.log(`  - ${user.email} (${user.name})`));
    
    console.log(`モデレーター: ${moderatorUsers.length}名`);
    
    console.log('\n✅ 権限付与完了！以下でアクセス可能:');
    console.log('URL: http://localhost:3010/admin/dashboard');
    console.log('権限: admin または moderator でログイン');
    
  } catch (error) {
    console.error('❌ 権限付与エラー:', error);
  } finally {
    await client.close();
  }
}

// 実行
require('dotenv').config({ path: '.env.local' });
grantAdminRole();