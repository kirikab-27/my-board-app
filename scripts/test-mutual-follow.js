const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB接続
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    process.exit(1);
  }
}

// Followモデルのスキーマ（簡易版）
const FollowSchema = new mongoose.Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked', 'muted'], default: 'accepted' },
  isAccepted: { type: Boolean, default: true },
  isPending: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  notificationLevel: { type: String, enum: ['all', 'mentions', 'none'], default: 'all' },
  followedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  mutedAt: { type: Date },
  blockedAt: { type: Date },
  interactionCount: { type: Number, default: 0 },
  lastInteractionAt: { type: Date }
}, {
  timestamps: true,
  collection: 'follows'
});

// 相互フォロー数取得メソッド
FollowSchema.statics.getMutualFollowCount = async function(userId) {
  // ユーザーがフォローしている人の一覧を取得
  const followingList = await this.find({ 
    follower: userId, 
    isAccepted: true 
  }).select('following');
  
  const followingIds = followingList.map(f => f.following);
  
  if (followingIds.length === 0) {
    return 0;
  }
  
  // その中で自分をフォローバックしている人の数を計算
  const mutualCount = await this.countDocuments({
    follower: { $in: followingIds },
    following: userId,
    isAccepted: true
  });
  
  return mutualCount;
};

const Follow = mongoose.models.Follow || mongoose.model('Follow', FollowSchema);

// ユーザーモデル（簡易版）
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
}, {
  timestamps: true,
  collection: 'users'
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function testMutualFollow() {
  await connectDB();
  
  console.log('\n🔍 フォロー関係テスト開始\n');
  
  try {
    // 既存のユーザーを取得
    const users = await User.find({}).limit(5);
    
    if (users.length < 2) {
      console.log('❌ テストには最低2人のユーザーが必要です');
      return;
    }
    
    console.log(`📝 テスト対象ユーザー: ${users.length}人`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user._id})`);
    });
    
    // 各ユーザーのフォロー統計を表示
    console.log('\n📊 フォロー統計:');
    
    for (const user of users) {
      const followerCount = await Follow.countDocuments({ 
        following: user._id.toString(), 
        isAccepted: true 
      });
      
      const followingCount = await Follow.countDocuments({ 
        follower: user._id.toString(), 
        isAccepted: true 
      });
      
      const mutualCount = await Follow.getMutualFollowCount(user._id.toString());
      
      console.log(`\n👤 ${user.name}:`);
      console.log(`   フォロワー: ${followerCount}人`);
      console.log(`   フォロー中: ${followingCount}人`);
      console.log(`   相互フォロー: ${mutualCount}人`);
      
      // フォロー関係の詳細表示
      const following = await Follow.find({ 
        follower: user._id.toString(), 
        isAccepted: true 
      });
      
      if (following.length > 0) {
        console.log(`   フォロー中のユーザー:`);
        for (const f of following) {
          // フォロー先ユーザーの情報を取得
          const followingUser = await User.findById(f.following);
          
          // 相互フォローかチェック
          const isMutual = await Follow.findOne({
            follower: f.following,
            following: user._id.toString(),
            isAccepted: true
          });
          
          if (followingUser) {
            console.log(`     - ${followingUser.name} ${isMutual ? '(相互)' : ''}`);
          }
        }
      }
    }
    
    // 全フォロー関係を表示
    console.log('\n🔗 全フォロー関係:');
    const allFollows = await Follow.find({ isAccepted: true });
    
    for (const follow of allFollows) {
      const followerUser = await User.findById(follow.follower);
      const followingUser = await User.findById(follow.following);
      
      if (followerUser && followingUser) {
        console.log(`   ${followerUser.name} → ${followingUser.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB切断完了');
  }
}

// スクリプト実行
if (require.main === module) {
  testMutualFollow().catch(console.error);
}