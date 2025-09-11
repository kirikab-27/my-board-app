import mongoose, { Schema, Document } from 'mongoose';

/**
 * 詳細権限モデル
 * Issue #47: RBAC権限システム・詳細権限管理
 */

export type ResourceType =
  | 'system' // システム全体
  | 'admins' // 管理者
  | 'users' // ユーザー
  | 'posts' // 投稿
  | 'comments' // コメント
  | 'media' // メディア
  | 'analytics' // 分析
  | 'audit' // 監査
  | 'config' // 設定
  | 'reports'; // 通報

export type ActionType =
  | 'read' // 読み取り
  | 'create' // 作成
  | 'update' // 更新
  | 'delete' // 削除
  | 'suspend' // 停止
  | 'restore' // 復元
  | 'export' // エクスポート
  | 'import' // インポート
  | 'backup' // バックアップ
  | 'write'; // 書き込み（システム用）

export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId;

  // 権限定義
  name: string; // 権限名（例: users.read）
  displayName: string; // 表示名
  description: string; // 説明

  // リソース・アクション
  resource: ResourceType; // 対象リソース
  action: ActionType; // 実行可能アクション

  // 条件・スコープ
  conditions?: {
    ownOnly?: boolean; // 自分のリソースのみ
    departmentOnly?: boolean; // 部門内のみ
    createdAfter?: Date; // 指定日以降のみ
    maxRecords?: number; // 最大レコード数
    excludeFields?: string[]; // 除外フィールド
  };

  // メタデータ
  category: string; // カテゴリー（管理・運用・閲覧等）
  riskLevel: 'low' | 'medium' | 'high' | 'critical'; // リスクレベル
  requiresMFA?: boolean; // 2FA必須フラグ
  requiresApproval?: boolean; // 承認必須フラグ

  // ライフサイクル
  isActive: boolean;
  isSystem: boolean; // システム定義（削除不可）
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  // インスタンスメソッド
  checkConditions(context: any): boolean;
}

// スタティックメソッドのインターフェース
export interface IPermissionModel extends mongoose.Model<IPermission> {
  createDefaultPermissions(): Promise<void>;
}

const PermissionSchema = new Schema<IPermission>(
  {
    // 権限定義
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: function (name: string) {
          return /^[a-z_]+\.[a-z_]+$/.test(name);
        },
        message: '権限名は resource.action 形式である必要があります',
      },
    },
    displayName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // リソース・アクション
    resource: {
      type: String,
      required: true,
      enum: [
        'system',
        'admins',
        'users',
        'posts',
        'comments',
        'media',
        'analytics',
        'audit',
        'config',
        'reports',
      ],
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'read',
        'create',
        'update',
        'delete',
        'suspend',
        'restore',
        'export',
        'import',
        'backup',
        'write',
      ],
      index: true,
    },

    // 条件・スコープ
    conditions: {
      ownOnly: {
        type: Boolean,
        default: false,
      },
      departmentOnly: {
        type: Boolean,
        default: false,
      },
      createdAfter: Date,
      maxRecords: {
        type: Number,
        min: 1,
        max: 10000,
      },
      excludeFields: [String],
    },

    // メタデータ
    category: {
      type: String,
      required: true,
      enum: ['管理', '運用', '閲覧', 'システム', 'セキュリティ'],
      index: true,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    requiresMFA: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },

    // ライフサイクル
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
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
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ category: 1, riskLevel: 1 });
PermissionSchema.index({ name: 1, isActive: 1 });

// スタティックメソッド: デフォルト権限の生成
PermissionSchema.statics.createDefaultPermissions = async function () {
  const defaultPermissions = [
    // システム権限
    {
      name: 'system.read',
      resource: 'system',
      action: 'read',
      category: 'システム',
      riskLevel: 'low',
    },
    {
      name: 'system.write',
      resource: 'system',
      action: 'write',
      category: 'システム',
      riskLevel: 'critical',
      requiresMFA: true,
    },
    {
      name: 'system.backup',
      resource: 'system',
      action: 'backup',
      category: 'システム',
      riskLevel: 'high',
      requiresMFA: true,
    },
    {
      name: 'system.restore',
      resource: 'system',
      action: 'restore',
      category: 'システム',
      riskLevel: 'critical',
      requiresMFA: true,
      requiresApproval: true,
    },

    // 管理者管理
    {
      name: 'admins.read',
      resource: 'admins',
      action: 'read',
      category: '管理',
      riskLevel: 'medium',
    },
    {
      name: 'admins.create',
      resource: 'admins',
      action: 'create',
      category: '管理',
      riskLevel: 'high',
      requiresMFA: true,
    },
    {
      name: 'admins.update',
      resource: 'admins',
      action: 'update',
      category: '管理',
      riskLevel: 'high',
      requiresMFA: true,
    },
    {
      name: 'admins.delete',
      resource: 'admins',
      action: 'delete',
      category: '管理',
      riskLevel: 'critical',
      requiresMFA: true,
      requiresApproval: true,
    },

    // ユーザー管理
    { name: 'users.read', resource: 'users', action: 'read', category: '運用', riskLevel: 'low' },
    {
      name: 'users.update',
      resource: 'users',
      action: 'update',
      category: '運用',
      riskLevel: 'medium',
    },
    {
      name: 'users.suspend',
      resource: 'users',
      action: 'suspend',
      category: 'セキュリティ',
      riskLevel: 'high',
    },
    {
      name: 'users.delete',
      resource: 'users',
      action: 'delete',
      category: 'セキュリティ',
      riskLevel: 'high',
      requiresApproval: true,
    },

    // 投稿管理
    { name: 'posts.read', resource: 'posts', action: 'read', category: '閲覧', riskLevel: 'low' },
    {
      name: 'posts.update',
      resource: 'posts',
      action: 'update',
      category: '運用',
      riskLevel: 'medium',
    },
    {
      name: 'posts.delete',
      resource: 'posts',
      action: 'delete',
      category: '運用',
      riskLevel: 'medium',
    },
    {
      name: 'posts.restore',
      resource: 'posts',
      action: 'restore',
      category: '運用',
      riskLevel: 'medium',
    },

    // 分析・監査
    {
      name: 'analytics.read',
      resource: 'analytics',
      action: 'read',
      category: '閲覧',
      riskLevel: 'low',
    },
    {
      name: 'analytics.export',
      resource: 'analytics',
      action: 'export',
      category: '運用',
      riskLevel: 'medium',
    },
    {
      name: 'audit.read',
      resource: 'audit',
      action: 'read',
      category: 'セキュリティ',
      riskLevel: 'medium',
    },
    {
      name: 'audit.export',
      resource: 'audit',
      action: 'export',
      category: 'セキュリティ',
      riskLevel: 'high',
      requiresMFA: true,
    },
  ];

  // システムユーザーIDを取得（または作成）
  const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');

  for (const perm of defaultPermissions) {
    const exists = await this.findOne({ name: perm.name });
    if (!exists) {
      await this.create({
        ...perm,
        displayName: perm.name.replace('.', ' ').toUpperCase(),
        description: `${perm.resource}の${perm.action}権限`,
        isSystem: true,
        createdBy: systemUserId,
      });
    }
  }
};

// インスタンスメソッド: 権限チェック
PermissionSchema.methods.checkConditions = function (context: any): boolean {
  if (!this.conditions) return true;

  // 自分のリソースのみ
  if (this.conditions.ownOnly && context.ownerId !== context.userId) {
    return false;
  }

  // 部門内のみ
  if (this.conditions.departmentOnly && context.department !== context.userDepartment) {
    return false;
  }

  // 作成日制限
  if (this.conditions.createdAfter && context.createdAt < this.conditions.createdAfter) {
    return false;
  }

  // レコード数制限
  if (this.conditions.maxRecords && context.recordCount > this.conditions.maxRecords) {
    return false;
  }

  return true;
};

export default (mongoose.models.Permission as IPermissionModel) ||
  mongoose.model<IPermission, IPermissionModel>('Permission', PermissionSchema);
