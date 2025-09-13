const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkPostMedia() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // 直接コレクションにアクセス
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');

    // 画像付き投稿を取得（最新3件）
    const posts = await postsCollection
      .find({ 'media.0': { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    console.log(`\n📝 ${posts.length}件の画像付き投稿を確認:\n`);

    for (const post of posts) {
      console.log('-------------------');
      console.log(`投稿ID: ${post._id}`);
      console.log(`タイトル: ${post.title || '(タイトルなし)'}`);
      console.log(`作成日: ${post.createdAt}`);
      console.log(`メディア数: ${post.media.length}`);

      for (let i = 0; i < post.media.length; i++) {
        const media = post.media[i];
        console.log(`\n  メディア${i + 1}:`);
        console.log(`    タイプ: ${media.type}`);
        console.log(`    URL: ${media.url}`);
        console.log(`    サムネイルURL: ${media.thumbnailUrl || 'なし'}`);

        // URLの変換パラメータを確認
        if (media.url && media.url.includes('/upload/')) {
          const uploadIndex = media.url.indexOf('/upload/');
          const versionIndex = media.url.indexOf('/v');
          const params = media.url.substring(uploadIndex + 8, versionIndex);
          console.log(`    URLパラメータ: ${params || 'なし'}`);
        }

        if (media.thumbnailUrl && media.thumbnailUrl.includes('/upload/')) {
          const uploadIndex = media.thumbnailUrl.indexOf('/upload/');
          const versionIndex = media.thumbnailUrl.indexOf('/v');
          const params = media.thumbnailUrl.substring(uploadIndex + 8, versionIndex);
          console.log(`    サムネイルパラメータ: ${params || 'なし'}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB切断完了');
  }
}

checkPostMedia();
