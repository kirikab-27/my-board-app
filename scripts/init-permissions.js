/**
 * 権限（Permission）の初期データを作成するスクリプト
 * Issue #47: RBAC権限管理システム
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDBスキーマの定義（簡易版）
const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: String,
  resource: { type: String, required: true },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['user_management', 'content_management', 'system_management', 'security', 'analytics'],
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  requiresMFA: { type: Boolean, default: false },
  requiresApproval: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Permission = mongoose.model('Permission', permissionSchema);

// 初期権限データ
const initialPermissions = [
  // ユーザー管理
  {
    name: 'users.read',
    displayName: 'ユーザー情報閲覧',
    description: 'ユーザー一覧・詳細情報の閲覧',
    resource: 'users',
    action: 'read',
    category: 'user_management',
    riskLevel: 'low',
  },
  {
    name: 'users.create',
    displayName: 'ユーザー作成',
    description: '新規ユーザーアカウントの作成',
    resource: 'users',
    action: 'create',
    category: 'user_management',
    riskLevel: 'medium',
  },
  {
    name: 'users.update',
    displayName: 'ユーザー情報更新',
    description: 'ユーザー情報の編集・更新',
    resource: 'users',
    action: 'update',
    category: 'user_management',
    riskLevel: 'medium',
  },
  {
    name: 'users.delete',
    displayName: 'ユーザー削除',
    description: 'ユーザーアカウントの削除',
    resource: 'users',
    action: 'delete',
    category: 'user_management',
    riskLevel: 'high',
    requiresMFA: true,
  },
  {
    name: 'users.ban',
    displayName: 'ユーザーBAN',
    description: 'ユーザーアカウントの停止・BAN',
    resource: 'users',
    action: 'ban',
    category: 'user_management',
    riskLevel: 'high',
    requiresMFA: true,
  },

  // 投稿管理
  {
    name: 'posts.read',
    displayName: '投稿閲覧',
    description: '投稿の閲覧（管理画面）',
    resource: 'posts',
    action: 'read',
    category: 'content_management',
    riskLevel: 'low',
  },
  {
    name: 'posts.moderate',
    displayName: '投稿モデレート',
    description: '投稿の承認・却下・非表示化',
    resource: 'posts',
    action: 'moderate',
    category: 'content_management',
    riskLevel: 'medium',
  },
  {
    name: 'posts.delete',
    displayName: '投稿削除',
    description: '投稿の削除',
    resource: 'posts',
    action: 'delete',
    category: 'content_management',
    riskLevel: 'medium',
  },

  // 管理者管理
  {
    name: 'admins.read',
    displayName: '管理者情報閲覧',
    description: '管理者一覧・権限情報の閲覧',
    resource: 'admins',
    action: 'read',
    category: 'system_management',
    riskLevel: 'medium',
  },
  {
    name: 'admins.create',
    displayName: '管理者作成',
    description: '新規管理者アカウントの作成',
    resource: 'admins',
    action: 'create',
    category: 'system_management',
    riskLevel: 'critical',
    requiresMFA: true,
    requiresApproval: true,
  },
  {
    name: 'admins.update',
    displayName: '管理者権限更新',
    description: '管理者の権限・ロール変更',
    resource: 'admins',
    action: 'update',
    category: 'system_management',
    riskLevel: 'critical',
    requiresMFA: true,
    requiresApproval: true,
  },
  {
    name: 'admins.delete',
    displayName: '管理者削除',
    description: '管理者アカウントの削除',
    resource: 'admins',
    action: 'delete',
    category: 'system_management',
    riskLevel: 'critical',
    requiresMFA: true,
    requiresApproval: true,
  },

  // システム管理
  {
    name: 'system.config',
    displayName: 'システム設定',
    description: 'システム設定の変更',
    resource: 'system',
    action: 'config',
    category: 'system_management',
    riskLevel: 'high',
    requiresMFA: true,
  },
  {
    name: 'system.backup',
    displayName: 'バックアップ管理',
    description: 'システムバックアップの作成・復元',
    resource: 'system',
    action: 'backup',
    category: 'system_management',
    riskLevel: 'critical',
    requiresMFA: true,
  },

  // セキュリティ
  {
    name: 'security.audit',
    displayName: '監査ログ閲覧',
    description: '監査ログ・セキュリティログの閲覧',
    resource: 'security',
    action: 'audit',
    category: 'security',
    riskLevel: 'high',
    requiresMFA: true,
  },
  {
    name: 'security.manage',
    displayName: 'セキュリティ管理',
    description: 'セキュリティ設定・ポリシーの管理',
    resource: 'security',
    action: 'manage',
    category: 'security',
    riskLevel: 'critical',
    requiresMFA: true,
    requiresApproval: true,
  },

  // 分析
  {
    name: 'analytics.read',
    displayName: '統計閲覧',
    description: 'システム統計・分析データの閲覧',
    resource: 'analytics',
    action: 'read',
    category: 'analytics',
    riskLevel: 'low',
  },
  {
    name: 'analytics.export',
    displayName: 'データエクスポート',
    description: '統計データのエクスポート',
    resource: 'analytics',
    action: 'export',
    category: 'analytics',
    riskLevel: 'medium',
  },
];

async function initPermissions() {
  try {
    // MongoDB接続
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // 既存の権限を確認
    const existingCount = await Permission.countDocuments();
    console.log(`Existing permissions: ${existingCount}`);

    if (existingCount > 0) {
      console.log('Permissions already exist. Updating...');
    }

    // 権限の作成または更新
    let created = 0;
    let updated = 0;

    for (const permData of initialPermissions) {
      const existing = await Permission.findOne({ name: permData.name });

      if (existing) {
        // 更新
        await Permission.updateOne(
          { name: permData.name },
          { $set: { ...permData, updatedAt: new Date() } }
        );
        updated++;
        console.log(`Updated: ${permData.name}`);
      } else {
        // 新規作成
        const permission = new Permission(permData);
        await permission.save();
        created++;
        console.log(`Created: ${permData.name}`);
      }
    }

    console.log(`\n✅ Permission initialization complete!`);
    console.log(`   Created: ${created} permissions`);
    console.log(`   Updated: ${updated} permissions`);
    console.log(`   Total: ${initialPermissions.length} permissions`);
  } catch (error) {
    console.error('Error initializing permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
}

// スクリプト実行
initPermissions();
