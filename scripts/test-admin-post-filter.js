/**
 * 管理者投稿フィルタリング機能のテストスクリプト
 * 
 * 実行方法:
 * node scripts/test-admin-post-filter.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDBの接続
async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDBに接続しました');
}

// テスト実行
async function testAdminPostFilter() {
  console.log('🧪 管理者投稿フィルタリング機能のテストを開始します');
  
  try {
    // 投稿データを取得
    const postsCollection = mongoose.connection.db.collection('posts');
    
    // 全投稿の取得
    const allPosts = await postsCollection.find({}).toArray();
    console.log(`📊 全投稿数: ${allPosts.length} 件`);
    
    // 役割別投稿数の確認
    const roleStats = await postsCollection.aggregate([
      {
        $group: {
          _id: '$authorRole',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('\n📈 役割別投稿統計:');
    roleStats.forEach(stat => {
      const role = stat._id || '未設定';
      console.log(`  ${role}: ${stat.count} 件`);
    });
    
    // 管理者投稿の確認
    const adminPosts = await postsCollection.find({ authorRole: 'admin' }).toArray();
    console.log(`\n👑 管理者投稿: ${adminPosts.length} 件`);
    
    if (adminPosts.length > 0) {
      console.log('📝 管理者投稿の例:');
      adminPosts.slice(0, 3).forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title || '(タイトルなし)'} - ${post.content.substring(0, 50)}...`);
      });
    }
    
    // 一般ユーザー投稿の確認（管理者以外）
    const nonAdminPosts = await postsCollection.find({ 
      authorRole: { $ne: 'admin' } 
    }).toArray();
    console.log(`\n👥 一般ユーザー投稿: ${nonAdminPosts.length} 件`);
    
    // フィルタリング動作の確認
    const filterQuery = { authorRole: { $ne: 'admin' } };
    const filteredCount = await postsCollection.countDocuments(filterQuery);
    
    console.log('\n🔍 フィルタリング結果:');
    console.log(`  管理者投稿を除外した投稿数: ${filteredCount} 件`);
    console.log(`  除外された投稿数: ${allPosts.length - filteredCount} 件`);
    
    // 検証結果の判定
    if (adminPosts.length === (allPosts.length - filteredCount)) {
      console.log('✅ フィルタリング機能は正常に動作しています');
    } else {
      console.log('❌ フィルタリング機能に問題があります');
    }
    
    // サンプルクエリの実行（一般ユーザー視点）
    console.log('\n🔎 一般ユーザーが見る投稿（最新5件）:');
    const userViewPosts = await postsCollection
      .find({ authorRole: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    userViewPosts.forEach((post, index) => {
      console.log(`  ${index + 1}. [${post.authorRole}] ${post.title || '(タイトルなし)'}`);
    });
    
    // 管理者視点のクエリ（参考）
    console.log('\n🔎 管理者が見る投稿（全ての投稿・最新5件）:');
    const adminViewPosts = await postsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    adminViewPosts.forEach((post, index) => {
      console.log(`  ${index + 1}. [${post.authorRole}] ${post.title || '(タイトルなし)'}`);
    });
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    throw error;
  }
}

// メイン実行関数
async function main() {
  try {
    await connectToDatabase();
    await testAdminPostFilter();
    
    console.log('\n🎉 テストが正常に完了しました');
  } catch (error) {
    console.error('\n💥 テスト中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 MongoDBから切断しました');
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { testAdminPostFilter };