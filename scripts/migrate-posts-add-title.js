/**
 * Phase 4.5 データマイグレーション
 * 既存投稿にtitleフィールドを追加するスクリプト
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI環境変数が設定されていません');
  process.exit(1);
}

async function migratePostsAddTitle() {
  let client;
  
  try {
    console.log('📦 MongoDB接続中...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const postsCollection = db.collection('posts');
    
    // titleフィールドが存在しない投稿を取得
    const postsWithoutTitle = await postsCollection.find({
      title: { $exists: false }
    }).toArray();
    
    console.log(`🔍 titleフィールドが存在しない投稿数: ${postsWithoutTitle.length}`);
    
    if (postsWithoutTitle.length === 0) {
      console.log('✅ すべての投稿にtitleフィールドが存在します');
      return;
    }
    
    // バッチ更新実行
    const bulkOperations = postsWithoutTitle.map(post => ({
      updateOne: {
        filter: { _id: post._id },
        update: { 
          $set: { 
            title: undefined // titleフィールドを追加（値は未設定）
          } 
        }
      }
    }));
    
    console.log('🔄 マイグレーション実行中...');
    const result = await postsCollection.bulkWrite(bulkOperations);
    
    console.log(`✅ マイグレーション完了:`);
    console.log(`   - 更新された投稿数: ${result.modifiedCount}`);
    console.log(`   - 一致した投稿数: ${result.matchedCount}`);
    
    // 結果確認
    const totalPosts = await postsCollection.countDocuments();
    const postsWithTitleField = await postsCollection.countDocuments({
      title: { $exists: true }
    });
    
    console.log(`📊 最終結果:`);
    console.log(`   - 総投稿数: ${totalPosts}`);
    console.log(`   - titleフィールド有り: ${postsWithTitleField}`);
    console.log(`   - titleフィールド無し: ${totalPosts - postsWithTitleField}`);
    
  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📦 MongoDB接続終了');
    }
  }
}

// スクリプト実行
if (require.main === module) {
  console.log('🚀 Phase 4.5 投稿titleフィールド追加マイグレーション開始');
  migratePostsAddTitle()
    .then(() => {
      console.log('🎉 マイグレーション正常終了');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 マイグレーション異常終了:', error);
      process.exit(1);
    });
}

module.exports = { migratePostsAddTitle };