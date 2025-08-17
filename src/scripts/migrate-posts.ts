import mongoose from 'mongoose';

// 環境変数からMongoDB URIを取得
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://boardUser:ZGtl9Q3vJUbl5u5d@cluster0.oikid53.mongodb.net/board-app?retryWrites=true&w=majority&appName=Cluster0';

async function migratePosts() {
  try {
    // MongoDBに接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');

    // すべての投稿にlikedByフィールドを追加（存在しない場合のみ）
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const result = await db.collection('posts').updateMany(
      { likedBy: { $exists: false } }, // likedByフィールドが存在しない投稿のみ
      { $set: { likedBy: [] } } // 空配列で初期化
    );

    console.log(`Migration completed: ${result.modifiedCount} posts updated`);
    
    // 現在の投稿数も確認
    const totalPosts = await db.collection('posts').countDocuments();
    console.log(`Total posts in database: ${totalPosts}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// スクリプトを実行
migratePosts();