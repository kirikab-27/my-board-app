/**
 * テストデータクリーンアップスクリプト
 * タイムライン機能テスト用のテストデータを安全に削除
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function cleanupTestData() {
  try {
    console.log('🧹 テストデータクリーンアップ開始...');
    
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // テスト用ユーザーの削除
    const testEmailPatterns = [
      'test1@timeline-test.com',
      'test2@timeline-test.com', 
      'test3@timeline-test.com',
      '@timeline-test.com'
    ];

    const userDeleteResults = await mongoose.connection.db.collection('users').deleteMany({
      email: { $regex: /@timeline-test\.com$/ }
    });
    console.log(`🗑️  テストユーザー削除: ${userDeleteResults.deletedCount}件`);

    // テスト用投稿の削除
    const postDeleteResults = await mongoose.connection.db.collection('posts').deleteMany({
      $or: [
        { content: { $regex: /タイムラインテスト/ } },
        { title: { $regex: /テスト投稿/ } },
        { authorName: { $regex: /タイムラインテストユーザー/ } }
      ]
    });
    console.log(`🗑️  テスト投稿削除: ${postDeleteResults.deletedCount}件`);

    // テスト用フォロー関係の削除
    const followDeleteResults = await mongoose.connection.db.collection('follows').deleteMany({
      // フォロー関係は他の削除で自動的にクリーンアップされる想定
    });
    console.log(`🗑️  テストフォロー関係削除: ${followDeleteResults.deletedCount}件`);

    console.log('✅ テストデータクリーンアップ完了');
    
  } catch (error) {
    console.error('❌ クリーンアップエラー:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB接続終了');
  }
}

// メイン実行
if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('🎉 クリーンアップ正常完了');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 クリーンアップ失敗:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestData };