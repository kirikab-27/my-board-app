import mongoose, { Schema, Document } from 'mongoose';

/**
 * 管理者ユーザーモデル
 * Issue #47: enterprise級RBAC・権限管理システム
 */

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface IAdminUser extends Document {
  _id: mongoose.Types.ObjectId;

  // 基本関連
  userId: mongoose.Types.ObjectId; // 元Userへの参照
  adminRole: AdminRole;

  // 権限管理
  permissions: string[]; // 個別権限配列
  rolePermissions: string[]; // ロール由来権限（キャッシュ）

  // セキュリティ
  allowedIPs: string[]; // IP制限（CIDR対応）
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // TOTP秘密鍵
  emergencyCode?: string; // 緊急アクセスコード

  // セッション管理
  maxSessions: number; // 同時ログイン制限
  activeSessions: number; // 現在アクティブセッション数
  lastLoginAt: Date;
  lastLoginIP?: string;

  // ライフサイクル
  isActive: boolean;
  suspendedAt?: Date;
  suspendedBy?: mongoose.Types.ObjectId;
  suspendedReason?: string;
  expiresAt?: Date; // 管理者権限期限

  // 監査情報
  createdBy: mongoose.Types.ObjectId;
  approvedBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;

  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    // 基本関連
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1ユーザー1管理者アカウント
      index: true,
    },
    adminRole: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator'],
      required: true,
      index: true,
    },

    // 権限管理
    permissions: [
      {
        type: String,
        validate: {
          validator: function (permission: string) {
            return /^[a-z_]+\.[a-z_]+$/.test(permission); // resource.action形式
          },
          message: '権限は resource.action 形式である必要があります',
        },
      },
    ],
    rolePermissions: [String], // ロール由来権限キャッシュ

    // セキュリティ
    allowedIPs: [
      {
        type: String,
        validate: {
          validator: function (ip: string) {
            // IPv4・IPv6・CIDR記法の検証
            return (
              /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip) ||
              /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/.test(ip)
            );
          },
          message: '無効なIPアドレスまたはCIDR記法です',
        },
      },
    ],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // 通常のクエリでは除外
    },
    emergencyCode: {
      type: String,
      select: false,
    },

    // セッション管理
    maxSessions: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    activeSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginIP: String,

    // ライフサイクル
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    suspendedAt: Date,
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    suspendedReason: {
      type: String,
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // 自動削除
    },

    // 監査情報
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// インデックス
AdminUserSchema.index({ userId: 1, isActive: 1 });
AdminUserSchema.index({ adminRole: 1, isActive: 1 });
AdminUserSchema.index({ createdBy: 1 });
AdminUserSchema.index({ lastLoginAt: -1 });

// 仮想フィールド
AdminUserSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// ミドルウェア：権限キャッシュ更新
AdminUserSchema.pre('save', async function (next) {
  if (this.isModified('adminRole') || this.isModified('permissions')) {
    // ロール由来権限を計算・キャッシュ
    this.rolePermissions = await (this as any).calculateRolePermissions();
  }
  next();
});

// インスタンスメソッド
AdminUserSchema.methods.calculateRolePermissions = async function (): Promise<string[]> {
  const Role = mongoose.models.Role;
  if (!Role) return [];

  const role = await Role.findOne({ name: this.adminRole });
  return role ? role.permissions : [];
};

AdminUserSchema.methods.hasPermission = function (permission: string): boolean {
  return this.permissions.includes(permission) || this.rolePermissions.includes(permission);
};

AdminUserSchema.methods.canAccess = function (resource: string, action: string): boolean {
  const permission = `${resource}.${action}`;
  return this.hasPermission(permission);
};

// セッション管理
AdminUserSchema.methods.incrementSession = async function (): Promise<void> {
  await this.updateOne({ $inc: { activeSessions: 1 } });
};

AdminUserSchema.methods.decrementSession = async function (): Promise<void> {
  await this.updateOne({
    $inc: { activeSessions: -1 },
    $max: { activeSessions: 0 }, // 負数防止
  });
};

export default mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
