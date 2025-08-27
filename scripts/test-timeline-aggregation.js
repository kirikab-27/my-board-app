const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testTimelineAggregation() {
  console.log('🔍 タイムライン集約テスト開始...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    const db = mongoose.connection.db;

    // 1. サンプルユーザーとフォロー関係を確認
    const users = await db.collection('users').find({}).limit(3).toArray();
    console.log(`👥 テスト用ユーザー数: ${users.length}`);
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user._id})`);
    });

    if (users.length < 2) {
      console.log('⚠️ テストにはユーザーが2人以上必要です');
      return;
    }

    const [testUser1, testUser2] = users;

    // 2. フォロー関係を確認
    const follows = await db
      .collection('follows')
      .find({
        follower: testUser1._id,
        isAccepted: true,
      })
      .toArray();

    console.log(`\n🤝 ${testUser1.name}のフォロー関係: ${follows.length}件`);

    const followedUserIds = follows.map((f) => f.following);
    const targetUserIds = [testUser1._id, ...followedUserIds];

    console.log(`📊 タイムライン対象ユーザー: ${targetUserIds.length}人`);

    // 3. 既存のタイムライン集約パイプライン（修正版）をテスト
    const aggregationPipeline = [
      // 1. 対象ユーザーの投稿をフィルタ
      {
        $match: {
          userId: { $in: targetUserIds.map((id) => id.toString()) },
          isDeleted: { $ne: true },
          isPublic: true,
        },
      },

      // 2. 投稿者情報をlookup（userIdを文字列からObjectIdに変換）
      {
        $addFields: {
          userIdObjectId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1,
                isVerified: 1,
              },
            },
          ],
        },
      },

      // 3. データ整形
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
        },
      },

      // 4. 不要フィールド除去
      {
        $project: {
          userIdObjectId: 0,
          __v: 0,
        },
      },

      // 5. 新しい順でソート
      { $sort: { createdAt: -1 } },

      // 6. 制限
      { $limit: 5 },
    ];

    console.log('\n🔍 集約パイプライン実行中...');
    const timelineStart = Date.now();
    const timelinePosts = await db.collection('posts').aggregate(aggregationPipeline).toArray();
    const queryTime = Date.now() - timelineStart;

    console.log(`✅ クエリ実行時間: ${queryTime}ms`);
    console.log(`📄 取得投稿数: ${timelinePosts.length}`);

    if (timelinePosts.length > 0) {
      console.log('\n📝 投稿サンプル:');
      timelinePosts.forEach((post, index) => {
        console.log(`\n${index + 1}. 投稿ID: ${post._id}`);
        console.log(`   タイトル: ${post.title || 'タイトルなし'}`);
        console.log(`   内容: ${post.content?.substring(0, 50)}...`);
        console.log(`   投稿者ID: ${post.userId}`);

        if (post.author) {
          console.log(`   ✅ 投稿者情報: ${post.author.name}`);
          console.log(`   　 - ユーザー名: ${post.author.username || 'なし'}`);
          console.log(`   　 - アバター: ${post.author.avatar || 'なし'}`);
          console.log(`   　 - 認証済み: ${post.author.isVerified || false}`);
        } else {
          console.log(`   ❌ 投稿者情報: なし`);
        }
      });

      const postsWithAuthor = timelinePosts.filter((post) => post.author);
      console.log(`\n📊 投稿者情報があるもの: ${postsWithAuthor.length}/${timelinePosts.length}`);

      if (postsWithAuthor.length === timelinePosts.length) {
        console.log('🎉 タイムライン集約修正成功！全ての投稿に投稿者情報が含まれています');
      } else {
        console.log('⚠️ 一部の投稿に投稿者情報が不足しています');
      }
    } else {
      console.log('⚠️ タイムライン投稿が見つかりませんでした');

      // デバッグ: 条件なしで投稿を確認
      const allPosts = await db.collection('posts').find({}).limit(3).toArray();
      console.log(`\n🔍 全投稿数: ${await db.collection('posts').countDocuments()}`);
      if (allPosts.length > 0) {
        console.log('サンプル投稿:');
        allPosts.forEach((post) => {
          console.log(
            `  - ${post.title || post.content?.substring(0, 30)} (userId: ${post.userId})`
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ テストエラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB接続終了');
  }
}

// スクリプト実行
if (require.main === module) {
  testTimelineAggregation()
    .then(() => console.log('\n🎯 テスト完了'))
    .catch((error) => {
      console.error('💥 スクリプトエラー:', error);
      process.exit(1);
    });
}

module.exports = testTimelineAggregation;
