const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function fixThumbnails() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // 直接コレクションにアクセス
    const db = mongoose.connection.db;
    const mediaCollection = db.collection('media');

    // 画像メディアを取得
    const media = await mediaCollection.find({ type: 'image' }).toArray();

    console.log(`\n📸 ${media.length}件の画像メディアを確認中...\n`);

    let updatedCount = 0;
    for (const item of media) {
      if (item.cloudinary?.secureUrl) {
        // 新しいサムネイルURLを生成
        const newThumbnailUrl = item.cloudinary.secureUrl.replace(
          '/upload/',
          '/upload/c_fit,w_150,h_150,g_center,q_auto,b_white/'
        );

        // 既存のサムネイルURLと異なる場合のみ更新
        if (item.cloudinary.thumbnailUrl !== newThumbnailUrl) {
          await mediaCollection.updateOne(
            { _id: item._id },
            {
              $set: {
                'cloudinary.thumbnailUrl': newThumbnailUrl,
              },
            }
          );
          updatedCount++;
          console.log(`✅ 更新: ${item.filename}`);
          console.log(`   旧: ${item.cloudinary.thumbnailUrl || 'なし'}`);
          console.log(`   新: ${newThumbnailUrl}`);
        }
      }
    }

    console.log(`\n✅ ${updatedCount}件のサムネイルURLを更新しました`);
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB切断完了');
  }
}

fixThumbnails();
