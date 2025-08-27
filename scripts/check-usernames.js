const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User model の簡易定義（既存スキーマと同じ）
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  displayName: String,
  avatar: String,
  stats: {
    followersCount: { type: Number, default: 0 }
  },
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUsernames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 ユーザー名設定状況チェック');
    console.log('================================');

    // 全ユーザー取得
    const users = await User.find({}).select('name email username displayName createdAt');
    console.log(`\n📋 総ユーザー数: ${users.length}`);

    let usernameSetCount = 0;
    let usernameEmptyCount = 0;
    let emailBasedCount = 0;

    console.log('\n🔍 ユーザー名詳細:');
    users.forEach((user, index) => {
      const hasUsername = user.username && user.username.trim().length > 0;
      const emailLeft = user.email ? user.email.split('@')[0] : '';
      const isEmailBased = hasUsername && user.username === emailLeft.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      console.log(`${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || '❌ 未設定'}`);
      console.log(`   DisplayName: ${user.displayName || 'なし'}`);
      console.log(`   EmailBased: ${isEmailBased ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');

      if (hasUsername) {
        usernameSetCount++;
        if (isEmailBased) emailBasedCount++;
      } else {
        usernameEmptyCount++;
      }
    });

    console.log('\n📊 統計サマリー:');
    console.log(`✅ Username設定済み: ${usernameSetCount}/${users.length}`);
    console.log(`❌ Username未設定: ${usernameEmptyCount}/${users.length}`);
    console.log(`📧 メールベース: ${emailBasedCount}/${usernameSetCount}`);
    
    if (usernameEmptyCount > 0) {
      console.log('\n⚠️  警告: Username未設定のユーザーが存在します');
      console.log('   メンション機能が正常動作しない可能性があります');
    }

    if (emailBasedCount === usernameSetCount && emailBasedCount > 0) {
      console.log('\n🎯 結果: 全てのusernameがメールベースで生成されています');
      console.log('   @メンション時の検索対象が適切です');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsernames();