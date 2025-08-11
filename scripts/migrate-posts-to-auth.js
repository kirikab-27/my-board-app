#!/usr/bin/env node

/**
 * 投稿データ移行スクリプト
 * 既存の投稿データを認証システム対応の新しい形式に移行する
 * 
 * 実行方法:
 * node scripts/migrate-posts-to-auth.js
 * 
 * 処理内容:
 * - 既存投稿にisPublic: trueを追加（デフォルト公開）
 * - userId、authorNameがnullの投稿は匿名投稿として維持
 * - likedByの形式は現在のまま維持（IPアドレス対応）
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'board-app'; // データベース名（環境に応じて調整）

if (!MONGODB_URI) {
  console.error('❌ エラー: MONGODB_URI環境変数が設定されていません');
  process.exit(1);
}

async function migratePosts() {
  console.log('🚀 投稿データ移行スクリプトを開始します...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ MongoDBに接続しました');
    
    const db = client.db(DB_NAME);
    const postsCollection = db.collection('posts');
    
    // 移行前の統計を取得
    const totalPosts = await postsCollection.countDocuments();
    const postsWithoutIsPublic = await postsCollection.countDocuments({ isPublic: { $exists: false } });
    const postsWithoutUserId = await postsCollection.countDocuments({ userId: { $exists: false } });
    const postsWithoutAuthorName = await postsCollection.countDocuments({ authorName: { $exists: false } });
    
    console.log('\n📊 移行前統計:');
    console.log(`   総投稿数: ${totalPosts}`);
    console.log(`   isPublicフィールドなし: ${postsWithoutIsPublic}`);
    console.log(`   userIdフィールドなし: ${postsWithoutUserId}`);
    console.log(`   authorNameフィールドなし: ${postsWithoutAuthorName}`);
    
    if (postsWithoutIsPublic === 0 && postsWithoutUserId === 0 && postsWithoutAuthorName === 0) {
      console.log('🎉 すべての投稿が既に移行済みです！');
      return;
    }
    
    console.log('\n🔄 データ移行を開始します...');
    
    // isPublicフィールドの追加
    if (postsWithoutIsPublic > 0) {
      const isPublicResult = await postsCollection.updateMany(
        { isPublic: { $exists: false } },
        { $set: { isPublic: true } }
      );
      console.log(`   ✅ isPublicフィールド追加: ${isPublicResult.modifiedCount}件`);
    }
    
    // userId、authorNameフィールドの追加（nullで初期化）
    if (postsWithoutUserId > 0) {
      const userIdResult = await postsCollection.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: null } }
      );
      console.log(`   ✅ userIdフィールド追加: ${userIdResult.modifiedCount}件`);
    }
    
    if (postsWithoutAuthorName > 0) {
      const authorNameResult = await postsCollection.updateMany(
        { authorName: { $exists: false } },
        { $set: { authorName: null } }
      );
      console.log(`   ✅ authorNameフィールド追加: ${authorNameResult.modifiedCount}件`);
    }
    
    // 移行後の統計を取得
    const finalTotalPosts = await postsCollection.countDocuments();
    const authPosts = await postsCollection.countDocuments({ userId: { $ne: null } });
    const anonymousPosts = await postsCollection.countDocuments({ userId: null });
    const publicPosts = await postsCollection.countDocuments({ isPublic: true });
    const privatePosts = await postsCollection.countDocuments({ isPublic: false });
    
    console.log('\n📊 移行後統計:');
    console.log(`   総投稿数: ${finalTotalPosts}`);
    console.log(`   認証ユーザー投稿: ${authPosts}件`);
    console.log(`   匿名投稿: ${anonymousPosts}件`);
    console.log(`   公開投稿: ${publicPosts}件`);
    console.log(`   非公開投稿: ${privatePosts}件`);
    
    // データ整合性チェック
    console.log('\n🔍 データ整合性チェック:');
    
    const invalidPosts = await postsCollection.find({
      $or: [
        { isPublic: { $exists: false } },
        { userId: { $exists: false } },
        { authorName: { $exists: false } }
      ]
    }).toArray();
    
    if (invalidPosts.length > 0) {
      console.log(`   ❌ 不整合なデータが見つかりました: ${invalidPosts.length}件`);
      invalidPosts.forEach((post, index) => {
        console.log(`     ${index + 1}. ID: ${post._id}, 欠落フィールド: ${
          !post.hasOwnProperty('isPublic') ? 'isPublic ' : ''
        }${!post.hasOwnProperty('userId') ? 'userId ' : ''
        }${!post.hasOwnProperty('authorName') ? 'authorName' : ''
        }`);
      });
    } else {
      console.log('   ✅ すべてのデータが正常に移行されました');
    }
    
    console.log('\n🎉 投稿データ移行が完了しました！');
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('💾 データベース接続を閉じました');
  }
}

// 確認プロンプト
function promptUser() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('⚠️  投稿データの移行を実行しますか？ (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// メイン実行
async function main() {
  console.log('🔧 投稿データ移行スクリプト');
  console.log('===============================');
  console.log('このスクリプトは既存の投稿データを認証システム対応形式に移行します。');
  console.log('');
  console.log('変更内容:');
  console.log('- 全投稿に isPublic: true を追加（既存投稿は公開として扱う）');
  console.log('- userId, authorName フィールドを追加（匿名投稿用にnull設定）');
  console.log('- likedBy配列は現在の形式を維持（後方互換性）');
  console.log('');
  
  if (await promptUser()) {
    await migratePosts();
  } else {
    console.log('🚫 移行をキャンセルしました');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migratePosts };