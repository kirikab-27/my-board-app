/**
 * 既存ユーザーにroleフィールドを追加するスクリプト
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// MongoDB接続
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    process.exit(1);
  }
}

async function updateUserRoles() {
  await connectDB();

  try {
    // roleフィールドが存在しないユーザーを検索して更新
    const result = await mongoose.connection.db.collection('users').updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    console.log(`✅ ${result.matchedCount}人のユーザーのroleを更新しました`);
    console.log(`✅ ${result.modifiedCount}人のユーザーが実際に更新されました`);

    // 更新後の全ユーザー確認
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n📋 全ユーザー一覧:');
    users.forEach(user => {
      console.log(`- ${user.email}: role=${user.role}, emailVerified=${user.emailVerified ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ 更新エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ データベース接続終了');
  }
}

// スクリプト実行
updateUserRoles();