/**
 * MongoDBのセッションとアカウント情報をクリアするスクリプト
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

async function clearSessions() {
  await connectDB();

  try {
    // セッションコレクションをクリア
    const sessions = await mongoose.connection.db.collection('sessions').deleteMany({});
    console.log(`✅ ${sessions.deletedCount}個のセッションを削除しました`);

    // アカウントコレクションをクリア（OAuth情報）
    const accounts = await mongoose.connection.db.collection('accounts').deleteMany({});
    console.log(`✅ ${accounts.deletedCount}個のアカウントを削除しました`);

    // 認証トークンをクリア
    const tokens = await mongoose.connection.db.collection('verificationtokens').deleteMany({});
    console.log(`✅ ${tokens.deletedCount}個の認証トークンを削除しました`);

    console.log('\n🔄 すべてのセッションがクリアされました。ブラウザでページをリフレッシュしてください。');

  } catch (error) {
    console.error('❌ クリアエラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ データベース接続終了');
  }
}

// スクリプト実行
clearSessions();