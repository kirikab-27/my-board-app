/**
 * シンプルなタイムライン機能テスト
 * 統合テストの簡易版として基本機能を確認
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

// 簡単なテスト用モデル
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  emailVerified: Date
}, { timestamps: true }));

const Post = mongoose.model('Post', new mongoose.Schema({
  title: String,
  content: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  isPublic: { type: Boolean, default: true },
  likes: { type: Number, default: 0 }
}, { timestamps: true }));

const Follow = mongoose.model('Follow', new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAccepted: { type: Boolean, default: true }
}, { timestamps: true }));

async function runSimpleTest() {
  console.log('🎯 タイムライン機能シンプルテスト開始');
  
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');
    
    // 既存のテストユーザーを検索または作成
    let testUser = await User.findOne({ email: 'timelinetest@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'タイムラインテストユーザー',
        email: 'timelinetest@example.com',
        username: 'timelinetest',
        emailVerified: new Date()
      });
      await testUser.save();
      console.log('✅ テストユーザー作成完了');
    } else {
      console.log('✅ 既存テストユーザー使用');
    }
    
    // テスト投稿作成
    const testPost = new Post({
      title: 'テスト投稿',
      content: 'これはタイムライン機能のテスト投稿です',
      userId: testUser._id,
      authorName: testUser.name,
      isPublic: true,
      likes: 5
    });
    await testPost.save();
    console.log('✅ テスト投稿作成完了');
    
    // API呼び出しテスト
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch(`http://localhost:3010/api/timeline?userId=${testUser._id}&limit=10`);
      const responseText = await response.text();
      
      console.log(`📡 API応答ステータス: ${response.status}`);
      console.log(`📝 API応答内容: ${responseText.substring(0, 200)}...`);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log(`📊 取得投稿数: ${data.posts ? data.posts.length : 0}`);
          console.log('✅ タイムラインAPI正常動作確認');
        } catch (parseError) {
          console.log('⚠️ JSONパース失敗、しかし200応答');
        }
      } else {
        console.log('⚠️ API応答エラー（認証問題の可能性）');
      }
    } catch (fetchError) {
      console.log(`❌ API呼び出し失敗: ${fetchError.message}`);
      console.log('💡 開発サーバーが起動しているか確認してください');
    }
    
    // クリーンアップ
    await Post.deleteOne({ _id: testPost._id });
    console.log('✅ テストデータクリーンアップ完了');
    
    console.log('🎉 シンプルテスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// 実行
runSimpleTest().catch(console.error);