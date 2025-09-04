import mongoose, { Schema, Document } from 'mongoose';
import type { AdminRole } from './AdminUser';

/**
 * ロール定義モデル
 * Issue #47: RBAC権限システム・ロール管理
 */

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  
  // 基本定義
  name: AdminRole;              // super_admin, admin, moderator
  displayName: string;          // 表示名
  description: string;          // ロール説明
  
  // 権限管理
  permissions: string[];        // このロールに含まれる権限
  inheritFrom?: AdminRole;      // 継承元ロール（階層構造）
  
  // メタデータ
  isSystem: boolean;            // システム定義ロール（削除不可）
  priority: number;             // 権限優先度（数字が大きいほど強い）
  
  // ライフサイクル
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  // 基本定義
  name: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // 権限管理
  permissions: [{
    type: String,
    validate: {
      validator: function(permission: string) {
        return /^[a-z_]+\.[a-z_]+$/.test(permission);
      },
      message: '権限は resource.action 形式である必要があります'
    }
  }],
  inheritFrom: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator']
  },
  
  // メタデータ
  isSystem: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  
  // ライフサイクル
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true,
  versionKey: false
});

// インデックス
RoleSchema.index({ name: 1, isActive: 1 });
RoleSchema.index({ priority: -1 });

// スタティックメソッド
RoleSchema.statics.getDefaultPermissions = function(roleName: AdminRole): string[] {
  const defaultPermissions = {
    super_admin: [
      // システム権限
      'system.read', 'system.write', 'system.backup', 'system.restore',
      // 管理者管理
      'admins.read', 'admins.create', 'admins.update', 'admins.delete',
      // ユーザー管理
      'users.read', 'users.update', 'users.suspend', 'users.delete',
      // 投稿管理
      'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
      // 分析・監査
      'analytics.read', 'analytics.export', 'audit.read', 'audit.export'
    ],
    admin: [
      // ユーザー管理
      'users.read', 'users.update', 'users.suspend', 'users.delete',
      // 投稿管理
      'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
      // 分析・監査
      'analytics.read', 'analytics.export', 'audit.read'
    ],
    moderator: [
      // 投稿管理のみ
      'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
      // 基本分析
      'analytics.read'
    ]
  };
  
  return defaultPermissions[roleName] || [];
};

// インスタンスメソッド
RoleSchema.methods.getAllPermissions = async function(): Promise<string[]> {
  let allPermissions = [...this.permissions];
  
  // 継承権限がある場合
  if (this.inheritFrom) {
    const parentRole = await mongoose.models.Role.findOne({ 
      name: this.inheritFrom, 
      isActive: true 
    });
    if (parentRole) {
      const parentPermissions = await parentRole.getAllPermissions();
      allPermissions = [...new Set([...allPermissions, ...parentPermissions])];
    }
  }
  
  return allPermissions;
};

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);