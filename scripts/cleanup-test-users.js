const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// .env.localファイルを読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanupTestUsers() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // 既存のテストユーザーを確認
    console.log('\n📋 Existing test users:');
    const testUsers = await usersCollection
      .find({
        email: { $regex: /test.*@example\.com/i },
      })
      .toArray();

    if (testUsers.length === 0) {
      console.log('📝 No test users found');
      return;
    }

    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}, Email: ${user.email}, ID: ${user._id}`);
    });

    // テストユーザーを削除
    console.log('\n🗑️ Deleting test users...');
    const deleteResult = await usersCollection.deleteMany({
      email: { $regex: /test.*@example\.com/i },
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} test users`);

    // 削除後の確認
    const remainingUsers = await usersCollection
      .find({
        email: { $regex: /test.*@example\.com/i },
      })
      .toArray();

    if (remainingUsers.length === 0) {
      console.log('✅ All test users have been successfully deleted');
    } else {
      console.log(`⚠️ ${remainingUsers.length} test users still remain`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

cleanupTestUsers();
