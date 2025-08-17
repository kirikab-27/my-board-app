/**
 * 既存投稿データにauthorRoleフィールドを追加するマイグレーションスクリプト
 * 
 * 実行方法:
 * node scripts/migrate-add-author-role.js --dry-run    # DryRun（テスト実行）
 * node scripts/migrate-add-author-role.js             # 実際のマイグレーション
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

// Userモデルの取得
async function getUserRoles() {
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  const userRoleMap = new Map();
  
  users.forEach(user => {
    userRoleMap.set(user._id.toString(), user.role || 'user');
  });
  
  return userRoleMap;
}

// 投稿データの移行
async function migratePostAuthorRoles(dryRun = false) {
  console.log(`🚀 投稿データのauthorRole移行を開始します ${dryRun ? '(DryRun)' : ''}`);
  
  try {
    // ユーザーの役割情報を取得
    const userRoleMap = await getUserRoles();
    console.log(`📊 ${userRoleMap.size} 人のユーザー情報を取得しました`);
    
    // authorRoleが未設定の投稿を取得
    const postsCollection = mongoose.connection.db.collection('posts');
    const postsToUpdate = await postsCollection.find({
      authorRole: { $exists: false }
    }).toArray();
    
    console.log(`📝 ${postsToUpdate.length} 件の投稿を更新対象として発見しました`);
    
    if (postsToUpdate.length === 0) {
      console.log('✅ 更新対象の投稿がありません');
      return;
    }
    
    let updateCount = 0;
    let adminPostCount = 0;
    let userPostCount = 0;
    let anonymousPostCount = 0;
    
    for (const post of postsToUpdate) {
      let authorRole = 'user'; // デフォルトは一般ユーザー
      
      if (post.userId) {
        // 認証ユーザーの投稿の場合、ユーザーの役割を取得
        const userRole = userRoleMap.get(post.userId);
        if (userRole) {
          authorRole = userRole;
        }
      } else {
        // 匿名投稿の場合はuserのまま
        anonymousPostCount++;
      }
      
      // 統計カウント
      if (authorRole === 'admin') {
        adminPostCount++;
      } else {
        userPostCount++;
      }
      
      if (!dryRun) {
        // 実際の更新実行
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: { authorRole: authorRole } }
        );
      }
      
      updateCount++;
      
      if (updateCount % 100 === 0) {
        console.log(`📈 進捗: ${updateCount}/${postsToUpdate.length} 件処理完了`);
      }
    }
    
    console.log('\n📊 移行結果:');
    console.log(`  総処理件数: ${updateCount} 件`);
    console.log(`  管理者投稿: ${adminPostCount} 件`);
    console.log(`  一般ユーザー投稿: ${userPostCount} 件`);
    console.log(`  匿名投稿: ${anonymousPostCount} 件`);
    
    if (dryRun) {
      console.log('\n🔍 DryRun完了 - 実際のデータは変更されていません');
    } else {
      console.log('\n✅ マイグレーション完了');
      
      // 検証: 更新後のデータを確認
      const updatedCount = await postsCollection.countDocuments({
        authorRole: { $exists: true }
      });
      console.log(`🔍 検証: ${updatedCount} 件の投稿にauthorRoleが設定されています`);
    }
    
  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
    throw error;
  }
}

// インデックスの作成
async function createIndexes(dryRun = false) {
  if (dryRun) {
    console.log('🔍 DryRun: インデックス作成はスキップします');
    return;
  }
  
  console.log('📊 authorRole用インデックスを作成中...');
  
  try {
    const postsCollection = mongoose.connection.db.collection('posts');
    
    // authorRole + createdAt の複合インデックス
    await postsCollection.createIndex(
      { authorRole: 1, createdAt: -1 },
      { name: 'authorRole_createdAt_index' }
    );
    
    console.log('✅ インデックス作成完了');
  } catch (error) {
    console.error('❌ インデックス作成エラー:', error);
    // インデックス作成エラーは処理を継続
  }
}

// メイン実行関数
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  try {
    await connectToDatabase();
    await migratePostAuthorRoles(dryRun);
    await createIndexes(dryRun);
    
    console.log('\n🎉 処理が正常に完了しました');
  } catch (error) {
    console.error('\n💥 処理中にエラーが発生しました:', error);
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

module.exports = { migratePostAuthorRoles, createIndexes };