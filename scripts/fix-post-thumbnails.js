const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function fixPostThumbnails() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // 直接コレクションにアクセス
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');

    // 画像付き投稿を取得
    const posts = await postsCollection.find({ 'media.0': { $exists: true } }).toArray();

    console.log(`\n📝 ${posts.length}件の画像付き投稿を確認中...\n`);

    let updatedCount = 0;
    for (const post of posts) {
      let needsUpdate = false;
      const updatedMedia = post.media.map((media) => {
        if (media.type === 'image' || media.type === 'gif') {
          // サムネイルURLを新しい形式に更新
          if (media.url) {
            const newThumbnailUrl = media.url.replace(
              '/upload/',
              '/upload/c_fit,w_150,h_150,g_center,q_auto,b_white/'
            );

            if (media.thumbnailUrl !== newThumbnailUrl) {
              console.log(`✅ 更新: 投稿 ${post._id} - ${post.title || '(タイトルなし)'}`);
              console.log(`   旧サムネ: ${media.thumbnailUrl || 'なし'}`);
              console.log(`   新サムネ: ${newThumbnailUrl}`);
              needsUpdate = true;
              return { ...media, thumbnailUrl: newThumbnailUrl };
            }
          }
        }
        return media;
      });

      if (needsUpdate) {
        await postsCollection.updateOne({ _id: post._id }, { $set: { media: updatedMedia } });
        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount}件の投稿のサムネイルURLを更新しました`);
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB切断完了');
  }
}

fixPostThumbnails();
