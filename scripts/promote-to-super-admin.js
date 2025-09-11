/**
 * ユーザーをsuper_adminに昇格させるスクリプト
 * Issue #47: RBAC権限管理システム
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// User スキーマの定義（簡易版）
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  emailVerified: Date,
});

const User = mongoose.model('User', userSchema);

// AdminUser スキーマの定義（簡易版）
const adminUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  adminRole: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    required: true,
  },
  permissions: [String],
  isActive: { type: Boolean, default: true },
  activatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
  twoFactorEnabled: { type: Boolean, default: false },
  allowedIPs: [String],
  suspendedAt: Date,
  suspendReason: String,
  expiresAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

// Role スキーマの定義（簡易版）
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: String,
  description: String,
  permissions: [String],
  inheritFrom: String,
  priority: Number,
  isSystem: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Role = mongoose.model('Role', roleSchema);

async function promoteToSuperAdmin(userEmail) {
  try {
    // MongoDB接続
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // ユーザーを検索
    console.log(`\nSearching for user: ${userEmail}`);
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`✅ User found: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role}`);

    // super_adminロールの確認・作成
    let superAdminRole = await Role.findOne({ name: 'super_admin' });

    if (!superAdminRole) {
      console.log('\nCreating super_admin role...');
      superAdminRole = new Role({
        name: 'super_admin',
        displayName: 'スーパー管理者',
        description: '全権限を持つ最高管理者',
        permissions: [
          'users.read',
          'users.create',
          'users.update',
          'users.delete',
          'users.ban',
          'posts.read',
          'posts.moderate',
          'posts.delete',
          'admins.read',
          'admins.create',
          'admins.update',
          'admins.delete',
          'system.config',
          'system.backup',
          'security.audit',
          'security.manage',
          'analytics.read',
          'analytics.export',
        ],
        priority: 100,
        isSystem: true,
        isActive: true,
      });
      await superAdminRole.save();
      console.log('✅ super_admin role created');
    }

    // AdminUserレコードの確認・作成・更新
    let adminUser = await AdminUser.findOne({ userId: user._id });

    if (adminUser) {
      console.log('\nUpdating existing AdminUser record...');
      adminUser.adminRole = 'super_admin';
      adminUser.permissions = superAdminRole.permissions;
      adminUser.isActive = true;
      adminUser.updatedAt = new Date();
      await adminUser.save();
      console.log('✅ AdminUser record updated');
    } else {
      console.log('\nCreating new AdminUser record...');
      adminUser = new AdminUser({
        userId: user._id,
        adminRole: 'super_admin',
        permissions: superAdminRole.permissions,
        isActive: true,
        activatedAt: new Date(),
        metadata: {
          promotedBy: 'system',
          promotedAt: new Date(),
          reason: 'Initial super_admin setup',
        },
      });
      await adminUser.save();
      console.log('✅ AdminUser record created');
    }

    // Userモデルのroleも更新
    user.role = 'admin'; // Userモデルでは'admin'として記録
    await user.save();
    console.log('✅ User role updated to admin');

    console.log('\n🎉 Success! User promoted to super_admin');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Admin Role: super_admin`);
    console.log(`   Permissions: ${adminUser.permissions.length} permissions granted`);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
}

// コマンドライン引数からメールアドレスを取得
const userEmail = process.argv[2] || 'kab27kav@gmail.com';

console.log('=================================');
console.log('Super Admin Promotion Script');
console.log('=================================');

// スクリプト実行
promoteToSuperAdmin(userEmail);
