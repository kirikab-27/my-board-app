// 初期ロール・権限データ作成スクリプト
const { MongoClient } = require('mongodb');

async function initAdminRoles() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 MongoDB接続完了 - 初期ロール作成');
    
    const db = client.db();
    const roles = db.collection('roles');
    
    // 既存ロール削除（初期化）
    await roles.deleteMany({ isSystem: true });
    console.log('🗑️  既存システムロールを削除');
    
    // 初期ロール定義
    const systemRoles = [
      {
        name: 'super_admin',
        displayName: 'スーパー管理者',
        description: '全権限・システム管理・管理者管理',
        permissions: [
          'system.read', 'system.write', 'system.backup', 'system.restore', 'system.settings',
          'admins.read', 'admins.create', 'admins.update', 'admins.delete', 'admins.suspend',
          'users.read', 'users.update', 'users.suspend', 'users.delete', 'users.export',
          'posts.read', 'posts.update', 'posts.delete', 'posts.restore', 'posts.export',
          'analytics.read', 'analytics.export', 'analytics.advanced',
          'audit.read', 'audit.export', 'audit.delete'
        ],
        isSystem: true,
        priority: 100,
        isActive: true,
        createdBy: null, // システム作成
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'admin',
        displayName: '管理者',
        description: 'ユーザー・投稿管理・統計閲覧',
        permissions: [
          'users.read', 'users.update', 'users.suspend', 'users.delete', 'users.export',
          'posts.read', 'posts.update', 'posts.delete', 'posts.restore', 'posts.export',
          'analytics.read', 'analytics.export',
          'audit.read'
        ],
        isSystem: true,
        priority: 50,
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'moderator',
        displayName: 'モデレーター',
        description: '投稿管理・基本統計閲覧',
        permissions: [
          'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
          'analytics.read'
        ],
        isSystem: true,
        priority: 25,
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // ロール作成
    console.log('🔐 システムロール作成中...');
    const roleResult = await roles.insertMany(systemRoles);
    console.log(`✅ ${roleResult.insertedCount}個のシステムロールを作成`);
    
    // 権限詳細定義
    const permissions = db.collection('permissions');
    await permissions.deleteMany({ isSystem: true });
    
    const systemPermissions = [
      // システム権限
      { name: 'system.read', resource: 'system', action: 'read', displayName: 'システム閲覧', description: 'システム状態・設定の閲覧' },
      { name: 'system.write', resource: 'system', action: 'write', displayName: 'システム設定', description: 'システム設定の変更' },
      { name: 'system.backup', resource: 'system', action: 'backup', displayName: 'バックアップ実行', description: 'データベースバックアップの実行' },
      
      // 管理者権限
      { name: 'admins.read', resource: 'admins', action: 'read', displayName: '管理者一覧', description: '管理者リストの閲覧' },
      { name: 'admins.create', resource: 'admins', action: 'create', displayName: '管理者作成', description: '新規管理者アカウントの作成' },
      { name: 'admins.delete', resource: 'admins', action: 'delete', displayName: '管理者削除', description: '管理者アカウントの削除' },
      
      // ユーザー権限
      { name: 'users.read', resource: 'users', action: 'read', displayName: 'ユーザー一覧', description: 'ユーザー情報の閲覧' },
      { name: 'users.suspend', resource: 'users', action: 'suspend', displayName: 'ユーザー停止', description: 'ユーザーアカウントの一時停止' },
      { name: 'users.delete', resource: 'users', action: 'delete', displayName: 'ユーザー削除', description: 'ユーザーアカウントの削除' },
      
      // 投稿権限
      { name: 'posts.read', resource: 'posts', action: 'read', displayName: '投稿一覧', description: '投稿内容の閲覧' },
      { name: 'posts.delete', resource: 'posts', action: 'delete', displayName: '投稿削除', description: '不適切投稿の削除' },
      { name: 'posts.restore', resource: 'posts', action: 'restore', displayName: '投稿復活', description: '削除投稿の復活' },
      
      // 分析権限
      { name: 'analytics.read', resource: 'analytics', action: 'read', displayName: '分析閲覧', description: '統計・分析データの閲覧' },
      { name: 'analytics.export', resource: 'analytics', action: 'export', displayName: '分析エクスポート', description: 'データのエクスポート' },
      
      // 監査権限
      { name: 'audit.read', resource: 'audit', action: 'read', displayName: '監査ログ閲覧', description: '操作ログの閲覧' },
      { name: 'audit.export', resource: 'audit', action: 'export', displayName: '監査エクスポート', description: 'ログのエクスポート' }
    ].map(p => ({
      ...p,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    console.log('🔧 権限定義作成中...');
    const permissionResult = await permissions.insertMany(systemPermissions);
    console.log(`✅ ${permissionResult.insertedCount}個の権限定義を作成`);
    
    // 初期スーパー管理者作成
    const adminUsers = db.collection('adminusers');
    const users = db.collection('users');
    
    // 既存のadmin権限ユーザーを取得
    const existingAdmins = await users.find({ role: 'admin' }).toArray();
    console.log(`🔍 既存admin権限ユーザー: ${existingAdmins.length}名`);
    
    // スーパー管理者に昇格
    for (const user of existingAdmins) {
      const existingAdminUser = await adminUsers.findOne({ userId: user._id });
      
      if (!existingAdminUser) {
        await adminUsers.insertOne({
          userId: user._id,
          adminRole: 'super_admin',
          permissions: [],  // ロール権限を使用
          rolePermissions: systemRoles[0].permissions,
          allowedIPs: ['0.0.0.0/0'],  // 初期は制限なし
          twoFactorEnabled: false,
          maxSessions: 5,
          activeSessions: 0,
          isActive: true,
          createdBy: null,  // システム作成
          approvedBy: null,
          lastModifiedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        });
        console.log(`✅ ${user.email} をスーパー管理者に設定`);
      }
    }
    
    console.log('\n🎉 初期RBAC設定完了！');
    console.log('📊 作成されたリソース:');
    console.log(`- ロール: ${roleResult.insertedCount}個`);
    console.log(`- 権限: ${permissionResult.insertedCount}個`);
    console.log(`- 管理者: ${existingAdmins.length}名`);
    
  } catch (error) {
    console.error('❌ 初期化エラー:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB接続終了');
  }
}

// 実行
require('dotenv').config({ path: '.env.local' });
console.log('🚀 RBAC初期化開始...');
initAdminRoles()
  .then(() => {
    console.log('✅ RBAC初期化完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ RBAC初期化失敗:', error);
    process.exit(1);
  });