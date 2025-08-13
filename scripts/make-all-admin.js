// 全ユーザーを管理者にするスクリプト（テスト用）
const { MongoClient } = require('mongodb');

async function makeAllUsersAdmin() {
  const mongoUri =
    'mongodb+srv://boardUser:ZGtl9Q3vJUbl5u5d@cluster0.oikid53.mongodb.net/board-app?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas接続成功');

    const db = client.db();

    // 全ユーザーを管理者にする
    const result = await db.collection('users').updateMany(
      { role: { $ne: 'admin' } }, // admin以外のユーザー
      { $set: { role: 'admin' } }
    );

    console.log(`🔧 ${result.modifiedCount} 人のユーザーを管理者に変更しました`);

    // 結果確認
    const users = await db.collection('users').find({}).toArray();
    console.log('\n📋 更新後のユーザー一覧:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}): role = ${user.role}`);
    });

    // 全セッションを削除（強制再ログイン）
    const sessionResult = await db.collection('sessions').deleteMany({});
    console.log(`\n🔐 ${sessionResult.deletedCount} 個のセッションを削除しました`);

    console.log('\n✅ 全ユーザーが管理者権限になりました。ブラウザで再ログインしてください。');
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await client.close();
    console.log('\n📡 MongoDB接続を閉じました');
  }
}

makeAllUsersAdmin();
