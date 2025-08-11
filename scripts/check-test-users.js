// テストユーザー確認・作成スクリプト
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB接続関数
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/board-app';
    await mongoose.connect(MONGODB_URI);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// User schema definition
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  emailVerified: { type: Date, default: null },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkAndCreateTestUsers() {
  try {
    console.log('🔍 MongoDB接続中...');
    await connectDB();
    console.log('✅ MongoDB接続成功');

    // 既存ユーザー確認
    console.log('\n📋 既存ユーザー確認中...');
    const existingUsers = await User.find({}, 'email name emailVerified createdAt').lean();
    
    console.log(`\n📊 データベース内ユーザー数: ${existingUsers.length}`);
    if (existingUsers.length > 0) {
      console.log('\n👥 既存ユーザー一覧:');
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   名前: ${user.name}`);
        console.log(`   認証状態: ${user.emailVerified ? '✅ 認証済み' : '❌ 未認証'}`);
        console.log(`   登録日: ${user.createdAt}`);
        console.log('');
      });
    }

    // テスト用ユーザー定義
    const testUsers = [
      {
        email: 'test-verified@example.com',
        name: '認証済みテストユーザー',
        password: 'TestPass123!',
        emailVerified: new Date(),
        description: '正常ログインテスト用'
      },
      {
        email: 'test-unverified@example.com',
        name: '未認証テストユーザー',
        password: 'TestPass123!',
        emailVerified: null,
        description: 'メール未認証エラーテスト用'
      }
    ];

    console.log('🧪 テスト用ユーザー確認・作成中...\n');

    for (const testUser of testUsers) {
      // ユーザー存在確認
      const existingUser = await User.findOne({ email: testUser.email });
      
      if (existingUser) {
        console.log(`✅ 既存: ${testUser.email}`);
        console.log(`   名前: ${existingUser.name}`);
        console.log(`   認証状態: ${existingUser.emailVerified ? '✅ 認証済み' : '❌ 未認証'}`);
        console.log(`   用途: ${testUser.description}\n`);
      } else {
        // テストユーザー作成
        console.log(`🔨 作成中: ${testUser.email}`);
        
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        
        const newUser = new User({
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
          emailVerified: testUser.emailVerified,
        });

        await newUser.save();
        
        console.log(`✅ 作成完了: ${testUser.email}`);
        console.log(`   名前: ${newUser.name}`);
        console.log(`   認証状態: ${newUser.emailVerified ? '✅ 認証済み' : '❌ 未認証'}`);
        console.log(`   用途: ${testUser.description}`);
        console.log(`   パスワード: ${testUser.password}\n`);
      }
    }

    // テスト準備完了メッセージ
    console.log('🎯 テスト環境準備完了!\n');
    console.log('📋 利用可能なテストユーザー:');
    console.log('1. 正常ログインテスト用:');
    console.log('   Email: test-verified@example.com');
    console.log('   Password: TestPass123!');
    console.log('   Status: ✅ 認証済み\n');
    
    console.log('2. 未認証エラーテスト用:');
    console.log('   Email: test-unverified@example.com'); 
    console.log('   Password: TestPass123!');
    console.log('   Status: ❌ 未認証\n');

    console.log('🚀 テスト開始準備完了!');
    console.log('   開発サーバー: http://localhost:3010');
    console.log('   ログインページ: http://localhost:3010/login');
    console.log('   テスト手順: README-login-test.md を参照');

  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateTestUsers();