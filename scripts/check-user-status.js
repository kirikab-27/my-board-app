// ユーザー状況確認スクリプト
const { MongoClient } = require('mongodb');

async function checkUserStatus() {
  const mongoUri =
    'mongodb+srv://boardUser:ZGtl9Q3vJUbl5u5d@cluster0.oikid53.mongodb.net/board-app?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas接続成功');

    const db = client.db();

    // 全ユーザーとロール確認
    const users = await db.collection('users').find({}).toArray();
    console.log('\n📋 全ユーザー一覧:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}): role = ${user.role || 'undefined'}`);
    });

    // 管理者権限のユーザーを確認
    const adminUsers = users.filter((user) => user.role === 'admin');
    console.log('\n👑 管理者権限を持つユーザー:');
    if (adminUsers.length > 0) {
      adminUsers.forEach((user) => {
        console.log(`- ${user.name} (${user.email})`);
      });
    } else {
      console.log('- なし');
    }

    // 現在のセッション確認
    const sessions = await db.collection('sessions').find({}).toArray();
    console.log('\n🔐 現在のセッション数:', sessions.length);

    if (sessions.length > 0) {
      console.log('セッション詳細:');
      for (const session of sessions) {
        const user = await db.collection('users').findOne({ _id: session.userId });
        if (user) {
          console.log(`- ${user.name} (${user.email}) - role: ${user.role || 'undefined'}`);
          console.log(`  期限: ${session.expires}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await client.close();
    console.log('\n📡 MongoDB接続を閉じました');
  }
}

checkUserStatus();
