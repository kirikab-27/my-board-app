// ユーザー権限確認スクリプト
const { MongoClient } = require('mongodb');

async function checkUserRoles() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 MongoDB接続完了 - ユーザー権限確認');
    
    const db = client.db();
    const users = db.collection('users');
    
    // 管理者権限ユーザーの確認
    const adminEmails = ['kab27kav@gmail.com', 'minomasa34@gmail.com'];
    
    console.log('\n🔍 管理者ユーザー権限確認:');
    for (const email of adminEmails) {
      const user = await users.findOne({ email: email.toLowerCase() });
      
      if (user) {
        console.log(`✅ ${email}:`);
        console.log(`   - 名前: ${user.name}`);
        console.log(`   - 権限: ${user.role || 'undefined'}`);
        console.log(`   - ID: ${user._id}`);
        console.log(`   - 最終更新: ${user.updatedAt}`);
      } else {
        console.log(`❌ ${email}: ユーザーが見つかりません`);
      }
    }
    
    // AdminUserコレクションの確認
    console.log('\n🔍 AdminUserコレクション確認:');
    const adminUsers = db.collection('adminusers');
    const adminRecords = await adminUsers.find({}).toArray();
    
    console.log(`AdminUser records: ${adminRecords.length}件`);
    adminRecords.forEach(admin => {
      console.log(`   - userId: ${admin.userId} → role: ${admin.adminRole}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB接続終了');
  }
}

// 実行
require('dotenv').config({ path: '.env.local' });
checkUserRoles();