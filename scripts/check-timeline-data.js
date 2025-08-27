import mongoose from 'mongoose';
import { config } from 'dotenv';

// 環境変数読み込み
config({ path: '.env.local' });

// MongoDB接続
async function checkTimelineData() {
  console.log('🔍 タイムラインデータ確認...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // コレクション直接確認
    const db = mongoose.connection.db;
    
    // ユーザー数確認
    const usersCount = await db.collection('users').countDocuments();
    console.log(`👥 ユーザー数: ${usersCount}`);

    // 投稿数確認
    const postsCount = await db.collection('posts').countDocuments();
    console.log(`📄 投稿数: ${postsCount}`);

    // フォロー関係数確認
    const followsCount = await db.collection('follows').countDocuments();
    console.log(`🤝 フォロー関係数: ${followsCount}`);

    // サンプルユーザー確認
    console.log('\n👤 サンプルユーザー:');
    const sampleUsers = await db.collection('users').find({}).limit(3).toArray();
    sampleUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - 登録: ${user.createdAt?.toLocaleDateString()}`);
    });

    // サンプル投稿確認
    console.log('\n📄 サンプル投稿:');
    const samplePosts = await db.collection('posts').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    samplePosts.forEach(post => {
      console.log(`  - "${post.title || 'タイトルなし'}" by ${post.authorName} - ${post.createdAt?.toLocaleDateString()}`);
    });

    // フォロー関係確認
    console.log('\n🤝 フォロー関係:');
    const sampleFollows = await db.collection('follows').find({ isAccepted: true }).limit(3).toArray();
    sampleFollows.forEach(follow => {
      console.log(`  - フォロワー: ${follow.follower} → フォロー中: ${follow.following}`);
    });

    return {
      users: usersCount,
      posts: postsCount,
      follows: followsCount
    };

  } catch (error) {
    console.error('❌ データ確認エラー:', error);
    return null;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB接続終了');
  }
}

checkTimelineData().then(result => {
  if (result) {
    console.log('\n📊 データ確認完了');
    if (result.users > 0 && result.posts > 0 && result.follows > 0) {
      console.log('✅ タイムライン機能に必要なデータが存在します');
    } else {
      console.log('⚠️ タイムライン機能に必要なデータが不足している可能性があります');
    }
  }
});