const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkThumbnails() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB接続成功');

    // 直接コレクションにアクセス
    const db = mongoose.connection.db;
    const mediaCollection = db.collection('media');

    // メディアを取得（最新5件）
    const media = await mediaCollection
      .find({ type: 'image' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log(`\n📸 画像メディア ${media.length}件を確認:\n`);

    for (const item of media) {
      console.log('-------------------');
      console.log(`ID: ${item._id}`);
      console.log(`ファイル名: ${item.filename}`);
      console.log(`URL: ${item.cloudinary?.secureUrl || 'なし'}`);
      console.log(`サムネイルURL (DB): ${item.cloudinary?.thumbnailUrl || 'なし'}`);

      // generateThumbnailメソッドで生成される想定URL
      if (item.cloudinary?.secureUrl) {
        const expectedThumbnail = item.cloudinary.secureUrl.replace(
          '/upload/',
          '/upload/c_fit,w_150,h_150,g_center,q_auto,b_white/'
        );
        console.log(`サムネイルURL (期待値): ${expectedThumbnail}`);
      }

      console.log(
        `Eager変換: ${item.cloudinary?.eager ? JSON.stringify(item.cloudinary.eager) : 'なし'}`
      );
    }
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB切断完了');
  }
}

checkThumbnails();
