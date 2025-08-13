// 管理者権限付与スクリプト
const { MongoClient } = require('mongodb');

async function updateAdminRole() {
  const mongoUri =
    'mongodb+srv://boardUser:ZGtl9Q3vJUbl5u5d@cluster0.oikid53.mongodb.net/board-app?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas接続成功');

    const db = client.db();

    // 現在のユーザー一覧を表示
    const users = await db.collection('users').find({}).toArray();
    console.log('\n📋 現在のユーザー一覧:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}): role = ${user.role || 'undefined'}`);
    });

    // 最初のユーザーを管理者にする
    if (users.length > 0) {
      const firstUser = users[0];
      if (firstUser.role !== 'admin') {
        const result = await db
          .collection('users')
          .updateOne({ _id: firstUser._id }, { $set: { role: 'admin' } });

        if (result.modifiedCount > 0) {
          console.log(
            `\n🔧 ユーザー「${firstUser.name}」(${firstUser.email})を管理者に設定しました`
          );
        }
      } else {
        console.log(`\n✅ ユーザー「${firstUser.name}」は既に管理者です`);
      }

      // 更新後の確認
      const updatedUser = await db.collection('users').findOne({ _id: firstUser._id });
      console.log(`\n🎯 更新確認: ${updatedUser.name} → role: ${updatedUser.role}`);
    } else {
      console.log('\n⚠️ ユーザーが見つかりません');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await client.close();
    console.log('\n📡 MongoDB接続を閉じました');
  }
}

updateAdminRole();
