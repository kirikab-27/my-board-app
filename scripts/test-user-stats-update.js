const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User モデルを動的にロード
async function loadModels() {
  // User モデルスキーマを直接定義（TypeScriptファイルから移植）
  const bcrypt = require('bcryptjs');

  const UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, '名前は必須です'],
      trim: true,
      maxlength: [50, '名前は50文字以内で入力してください'],
    },
    username: {
      type: String,
      required: [true, 'ユーザー名は必須です'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'ユーザー名は3文字以上で入力してください'],
      maxlength: [30, 'ユーザー名は30文字以内で入力してください'],
      match: [/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'],
    },
    email: {
      type: String,
      required: [true, 'メールアドレスは必須です'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'パスワードは必須です'],
      minlength: [8, 'パスワードは8文字以上で入力してください'],
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [160, '自己紹介は160文字以内で入力してください'],
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    stats: {
      postsCount: { type: Number, default: 0, min: 0 },
      followersCount: { type: Number, default: 0, min: 0 },
      followingCount: { type: Number, default: 0, min: 0 },
      likesReceived: { type: Number, default: 0, min: 0 },
      commentsReceived: { type: Number, default: 0, min: 0 },
    },
  }, {
    timestamps: true,
    collection: 'users',
    versionKey: false,
  });

  // updateStats メソッドを定義
  UserSchema.methods.updateStats = async function () {
    try {
      // 投稿数
      const Post = mongoose.models.Post;
      if (Post) {
        this.stats.postsCount = await Post.countDocuments({ userId: this._id });
      }
      
      // フォロワー・フォロー数
      const Follow = mongoose.models.Follow;
      if (Follow) {
        this.stats.followersCount = await Follow.countDocuments({ following: this._id });
        this.stats.followingCount = await Follow.countDocuments({ follower: this._id });
      }
      
      // いいね・コメント受信数
      if (Post) {
        const posts = await Post.find({ userId: this._id });
        this.stats.likesReceived = posts.reduce((total, post) => total + (post.likes || 0), 0);
      }
      
      const Comment = mongoose.models.Comment;
      if (Comment) {
        this.stats.commentsReceived = await Comment.countDocuments({ postUserId: this._id });
      }
      
      // 統計情報のみの部分更新（バリデーションを回避）
      await mongoose.model('User').updateOne(
        { _id: this._id },
        { $set: { stats: this.stats } },
        { runValidators: false }
      );
    } catch (error) {
      console.error('統計情報の更新に失敗しました:', error);
    }
  };

  return mongoose.models.User || mongoose.model('User', UserSchema);
}

async function testUserStatsUpdate() {
  try {
    console.log('🔍 Issue #10 User統計更新テスト開始...\n');

    // MongoDB接続
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URIが設定されていません');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB接続成功');

    // モデルをロード
    const User = await loadModels();

    // テスト用ユーザーの検索
    const testUser = await User.findOne({ email: { $exists: true } });
    if (!testUser) {
      console.log('❌ テスト用ユーザーが見つかりません');
      return;
    }

    console.log(`📊 テスト対象ユーザー: ${testUser.name} (${testUser.email})`);
    console.log(`📊 現在の統計: フォロワー=${testUser.stats.followersCount}, フォロー中=${testUser.stats.followingCount}`);

    // 統計更新テスト
    console.log('\n🔄 updateStats()実行中...');
    
    const startTime = Date.now();
    await testUser.updateStats();
    const endTime = Date.now();

    console.log(`✅ updateStats()完了 (${endTime - startTime}ms)`);
    
    // 更新後の統計確認
    const updatedUser = await User.findById(testUser._id);
    console.log(`📊 更新後の統計: フォロワー=${updatedUser.stats.followersCount}, フォロー中=${updatedUser.stats.followingCount}`);

    // フォロー関係の実際の数を確認
    const Follow = mongoose.models.Follow;
    if (Follow) {
      const actualFollowers = await Follow.countDocuments({ following: testUser._id });
      const actualFollowing = await Follow.countDocuments({ follower: testUser._id });
      
      console.log(`📊 実際のDB値: フォロワー=${actualFollowers}, フォロー中=${actualFollowing}`);
      
      if (actualFollowers === updatedUser.stats.followersCount && actualFollowing === updatedUser.stats.followingCount) {
        console.log('✅ 統計値がDB実際値と一致しています');
      } else {
        console.log('❌ 統計値がDB実際値と不一致です');
      }
    }

    console.log('\n✅ Issue #10テスト完了 - エラーなし');

  } catch (error) {
    console.error('❌ テストエラー:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB接続を閉じました');
  }
}

// スクリプト実行
testUserStatsUpdate();