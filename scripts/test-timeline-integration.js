/**
 * タイムライン機能統合テスト
 * 
 * このスクリプトは以下をテストします：
 * 1. タイムラインAPI基本機能
 * 2. フォロー機能との統合
 * 3. パフォーマンス要件（1秒以内）
 * 4. リアルタイム更新機能
 * 5. エラーハンドリング
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

// MongoDB接続とモデル定義
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  emailVerified: Date,
  followers: { count: { type: Number, default: 0 } },
  following: { count: { type: Number, default: 0 } }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  isPublic: { type: Boolean, default: true },
  likes: { type: Number, default: 0 },
  likedBy: [String],
  hashtags: [String],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAccepted: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema);

const TEST_CONFIG = {
  API_BASE: 'http://localhost:3010',
  PERFORMANCE_THRESHOLD: 1000, // 1秒
  TEST_USER_COUNT: 5,
  TEST_POST_COUNT: 20
};

class TimelineIntegrationTest {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    this.testUsers = [];
    this.testPosts = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '💡',
      'success': '✅',
      'error': '❌', 
      'warning': '⚠️',
      'performance': '⚡'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    const startTime = Date.now();
    
    try {
      this.log(`開始: ${name}`, 'info');
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.passed++;
      this.testResults.tests.push({
        name,
        status: 'PASSED',
        duration,
        result
      });
      
      this.log(`成功: ${name} (${duration}ms)`, 'success');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.failed++;
      this.testResults.tests.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      this.log(`失敗: ${name} - ${error.message}`, 'error');
      throw error;
    }
  }

  async setupTestData() {
    await this.runTest('テストデータセットアップ', async () => {
      // テストユーザー作成
      for (let i = 0; i < TEST_CONFIG.TEST_USER_COUNT; i++) {
        const user = new User({
          name: `テストユーザー${i + 1}`,
          email: `test${i + 1}@timeline-test.com`,
          username: `testuser${i + 1}`,
          emailVerified: new Date(),
          followers: { count: Math.floor(Math.random() * 100) },
          following: { count: Math.floor(Math.random() * 50) }
        });
        
        await user.save();
        this.testUsers.push(user);
      }

      // フォロー関係作成
      for (let i = 0; i < this.testUsers.length - 1; i++) {
        const follow = new Follow({
          follower: this.testUsers[i]._id,
          following: this.testUsers[i + 1]._id,
          isAccepted: true,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 7) // 過去1週間内
        });
        await follow.save();
      }

      // テスト投稿作成
      for (let i = 0; i < TEST_CONFIG.TEST_POST_COUNT; i++) {
        const randomUser = this.testUsers[Math.floor(Math.random() * this.testUsers.length)];
        const post = new Post({
          title: `テスト投稿 ${i + 1}`,
          content: `これはタイムライン機能をテストするための投稿です。投稿番号: ${i + 1}`,
          userId: randomUser._id,
          authorName: randomUser.name,
          isPublic: true,
          likes: Math.floor(Math.random() * 50),
          likedBy: [],
          hashtags: [`#テスト`, `#タイムライン`],
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 3), // 過去3日内
          updatedAt: new Date()
        });
        
        await post.save();
        this.testPosts.push(post);
      }

      return {
        users: this.testUsers.length,
        posts: this.testPosts.length,
        follows: this.testUsers.length - 1
      };
    });
  }

  async testTimelineAPI() {
    const testUser = this.testUsers[0];
    
    await this.runTest('タイムラインAPI基本機能テスト', async () => {
      const response = await fetch(`${TEST_CONFIG.API_BASE}/api/timeline?userId=${testUser._id}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // レスポンス構造確認
      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error('投稿リストが正しく返されていません');
      }
      
      if (typeof data.pagination !== 'object') {
        throw new Error('ページネーション情報が不正です');
      }
      
      // 投稿データ構造確認
      if (data.posts.length > 0) {
        const post = data.posts[0];
        const requiredFields = ['_id', 'title', 'content', 'author', 'createdAt', 'likes'];
        
        for (const field of requiredFields) {
          if (!(field in post)) {
            throw new Error(`投稿に必要フィールド '${field}' がありません`);
          }
        }
      }
      
      return {
        postsCount: data.posts.length,
        hasNextPage: data.pagination.hasNextPage,
        followingCount: data.userStats?.followingCount || 0,
        followerCount: data.userStats?.followerCount || 0
      };
    });
  }

  async testTimelinePerformance() {
    const testUser = this.testUsers[0];
    
    await this.runTest('タイムラインパフォーマンステスト', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${TEST_CONFIG.API_BASE}/api/timeline?userId=${testUser._id}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      this.log(`API応答時間: ${responseTime}ms`, 'performance');
      
      if (responseTime > TEST_CONFIG.PERFORMANCE_THRESHOLD) {
        throw new Error(`パフォーマンス要件未達成: ${responseTime}ms > ${TEST_CONFIG.PERFORMANCE_THRESHOLD}ms`);
      }
      
      // サーバー側クエリ時間も確認
      if (data.queryTime && data.queryTime > TEST_CONFIG.PERFORMANCE_THRESHOLD) {
        this.log(`サーバー側クエリ時間: ${data.queryTime}ms`, 'warning');
      }
      
      return {
        responseTime,
        queryTime: data.queryTime,
        postsReturned: data.posts.length
      };
    });
  }

  async testRealtimeUpdates() {
    const testUser = this.testUsers[0];
    
    await this.runTest('リアルタイム更新APIテスト', async () => {
      // 新しい投稿を作成
      const newPost = new Post({
        title: 'リアルタイムテスト投稿',
        content: 'この投稿はリアルタイム更新機能をテストするためのものです',
        userId: this.testUsers[1]._id,
        authorName: this.testUsers[1].name,
        isPublic: true,
        likes: 0,
        likedBy: [],
        createdAt: new Date()
      });
      
      await newPost.save();
      
      // 少し待ってから更新チェック
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(
        `${TEST_CONFIG.API_BASE}/api/timeline/updates?userId=${testUser._id}&since=${new Date(Date.now() - 1000).toISOString()}&includePreview=true`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (typeof data.newPostsCount !== 'number') {
        throw new Error('新着投稿数が正しく返されていません');
      }
      
      return {
        newPostsCount: data.newPostsCount,
        hasPreview: data.preview && data.preview.length > 0,
        previewCount: data.preview ? data.preview.length : 0
      };
    });
  }

  async testErrorHandling() {
    await this.runTest('エラーハンドリングテスト', async () => {
      const tests = [
        {
          name: '無効なユーザーID',
          url: `${TEST_CONFIG.API_BASE}/api/timeline?userId=invalid&limit=10`,
          expectedStatus: 400
        },
        {
          name: '存在しないユーザーID', 
          url: `${TEST_CONFIG.API_BASE}/api/timeline?userId=507f1f77bcf86cd799439011&limit=10`,
          expectedStatus: 404
        },
        {
          name: '無効なlimitパラメータ',
          url: `${TEST_CONFIG.API_BASE}/api/timeline?userId=${this.testUsers[0]._id}&limit=invalid`,
          expectedStatus: 400
        }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const response = await fetch(test.url);
          const isExpectedStatus = response.status === test.expectedStatus;
          
          results.push({
            name: test.name,
            actualStatus: response.status,
            expectedStatus: test.expectedStatus,
            passed: isExpectedStatus
          });
          
          if (!isExpectedStatus) {
            this.log(`${test.name}: 期待ステータス ${test.expectedStatus}, 実際 ${response.status}`, 'warning');
          }
        } catch (error) {
          results.push({
            name: test.name,
            error: error.message,
            passed: false
          });
        }
      }
      
      const passedCount = results.filter(r => r.passed).length;
      
      if (passedCount < tests.length) {
        throw new Error(`エラーハンドリングテスト: ${passedCount}/${tests.length} 通過`);
      }
      
      return { passedCount, totalCount: tests.length };
    });
  }

  async testCursorPagination() {
    const testUser = this.testUsers[0];
    
    await this.runTest('カーソルページネーションテスト', async () => {
      // 最初のページ取得
      const firstResponse = await fetch(`${TEST_CONFIG.API_BASE}/api/timeline?userId=${testUser._id}&limit=5`);
      const firstData = await firstResponse.json();
      
      if (!firstData.pagination.nextCursor) {
        return { message: 'カーソルなし（データ不足）', pages: 1 };
      }
      
      // 次のページ取得
      const secondResponse = await fetch(
        `${TEST_CONFIG.API_BASE}/api/timeline?userId=${testUser._id}&limit=5&cursor=${firstData.pagination.nextCursor}`
      );
      const secondData = await secondResponse.json();
      
      // 重複チェック
      const firstIds = firstData.posts.map(p => p._id);
      const secondIds = secondData.posts.map(p => p._id);
      const duplicates = firstIds.filter(id => secondIds.includes(id));
      
      if (duplicates.length > 0) {
        throw new Error(`ページネーションで重複が発生: ${duplicates.length}件`);
      }
      
      // 時系列順序チェック
      const allPosts = [...firstData.posts, ...secondData.posts];
      for (let i = 1; i < allPosts.length; i++) {
        const prevDate = new Date(allPosts[i - 1].createdAt);
        const currDate = new Date(allPosts[i].createdAt);
        
        if (prevDate < currDate) {
          throw new Error('時系列順序が正しくありません');
        }
      }
      
      return {
        page1Posts: firstData.posts.length,
        page2Posts: secondData.posts.length,
        noDuplicates: duplicates.length === 0,
        correctOrder: true
      };
    });
  }

  async cleanupTestData() {
    await this.runTest('テストデータクリーンアップ', async () => {
      const userIds = this.testUsers.map(u => u._id);
      const postIds = this.testPosts.map(p => p._id);
      
      await Promise.all([
        Post.deleteMany({ _id: { $in: postIds } }),
        Post.deleteMany({ title: 'リアルタイムテスト投稿' }),
        Follow.deleteMany({ follower: { $in: userIds } }),
        Follow.deleteMany({ following: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } })
      ]);
      
      return {
        cleanedUsers: userIds.length,
        cleanedPosts: postIds.length
      };
    });
  }

  printSummary() {
    this.log('\n🎯 タイムライン機能統合テスト結果', 'info');
    this.log('=' * 50, 'info');
    this.log(`総テスト数: ${this.testResults.total}`, 'info');
    this.log(`成功: ${this.testResults.passed}`, 'success');
    this.log(`失敗: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    this.log(`成功率: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');
    
    if (this.testResults.tests.length > 0) {
      this.log('\n📊 詳細結果:', 'info');
      this.testResults.tests.forEach(test => {
        const status = test.status === 'PASSED' ? '✅' : '❌';
        this.log(`  ${status} ${test.name} (${test.duration}ms)`);
        if (test.error) {
          this.log(`    エラー: ${test.error}`, 'error');
        }
      });
    }
  }

  async run() {
    this.log('🚀 タイムライン機能統合テスト開始', 'info');
    
    try {
      // MongoDB接続
      await mongoose.connect(process.env.MONGODB_URI);
      this.log('✅ MongoDB接続成功', 'success');
      
      // テスト実行
      await this.setupTestData();
      await this.testTimelineAPI();
      await this.testTimelinePerformance();
      await this.testRealtimeUpdates();
      await this.testErrorHandling();
      await this.testCursorPagination();
      await this.cleanupTestData();
      
      this.log('🎉 すべてのテストが完了しました', 'success');
      
    } catch (error) {
      this.log(`💥 テスト実行中にエラーが発生: ${error.message}`, 'error');
    } finally {
      await mongoose.disconnect();
      this.printSummary();
    }
    
    // 失敗があった場合は終了コード1で終了
    if (this.testResults.failed > 0) {
      process.exit(1);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const test = new TimelineIntegrationTest();
  test.run().catch(console.error);
}

module.exports = TimelineIntegrationTest;