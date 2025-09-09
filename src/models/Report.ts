import { Schema, model, models, Document } from 'mongoose';

/**
 * 通報レポートモデル
 * Issue #60: レポート・通報システム
 */

export interface IReport extends Document {
  // 基本情報
  reportNumber: string; // 受付番号（自動生成）
  reporterId: string; // 通報者のユーザーID
  reporterEmail?: string; // 通報者のメール（匿名通報の場合）

  // 通報対象
  targetType: 'post' | 'comment' | 'user' | 'media'; // 通報対象の種類
  targetId: string; // 通報対象のID
  targetUrl?: string; // 通報対象のURL（参照用）

  // 通報内容
  category: 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'misinformation' | 'other';
  subcategory?: string; // 詳細カテゴリー
  description: string; // 通報理由の詳細
  evidenceUrls?: string[]; // 証拠画像・ファイルのURL

  // 優先度・ステータス
  priority: 'low' | 'medium' | 'high' | 'critical'; // 優先度
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected' | 'escalated';

  // 担当者情報
  assignedTo?: string; // 担当者のユーザーID
  assignedAt?: Date; // アサイン日時

  // 対応情報
  resolution?: string; // 対応内容
  responseTemplate?: string; // 使用したテンプレート
  respondedAt?: Date; // 対応日時
  respondedBy?: string; // 対応者のユーザーID

  // エスカレーション
  escalatedTo?: string; // エスカレーション先
  escalatedAt?: Date; // エスカレーション日時
  escalationReason?: string; // エスカレーション理由

  // メタデータ
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    language?: string;
    previousReports?: number; // 同一ユーザーからの過去の通報数
  };

  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  closedAt?: Date;
}

// カテゴリー別の優先度設定
const CATEGORY_PRIORITY_MAP = {
  harassment: 'high',
  copyright: 'high',
  inappropriate: 'medium',
  misinformation: 'medium',
  spam: 'low',
  other: 'low',
};

const ReportSchema = new Schema<IReport>(
  {
    // 基本情報
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reporterId: {
      type: String,
      required: false, // 匿名通報を許可
      index: true,
    },
    reporterEmail: {
      type: String,
      required: false,
    },

    // 通報対象
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'comment', 'user', 'media'],
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetUrl: String,

    // 通報内容
    category: {
      type: String,
      required: true,
      enum: ['spam', 'inappropriate', 'harassment', 'copyright', 'misinformation', 'other'],
      index: true,
    },
    subcategory: String,
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    evidenceUrls: [String],

    // 優先度・ステータス
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'reviewing', 'resolved', 'rejected', 'escalated'],
      default: 'pending',
      index: true,
    },

    // 担当者情報
    assignedTo: {
      type: String,
      index: true,
    },
    assignedAt: Date,

    // 対応情報
    resolution: {
      type: String,
      maxlength: 5000,
    },
    responseTemplate: String,
    respondedAt: Date,
    respondedBy: String,

    // エスカレーション
    escalatedTo: String,
    escalatedAt: Date,
    escalationReason: String,

    // メタデータ
    metadata: {
      userAgent: String,
      ipAddress: String,
      language: String,
      previousReports: Number,
    },

    // タイムスタンプ
    reviewedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

// 複合インデックス
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 }); // キュー管理用
ReportSchema.index({ reporterId: 1, createdAt: -1 }); // ユーザー履歴用
ReportSchema.index({ targetType: 1, targetId: 1 }); // 対象別検索用
ReportSchema.index({ assignedTo: 1, status: 1 }); // 担当者別タスク用

// 自動受付番号生成
ReportSchema.pre('save', async function (next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.reportNumber = `RPT-${year}${month}${day}-${random}`;
  }

  // カテゴリーに基づく自動優先度設定
  if (!this.priority || this.isNew) {
    this.priority =
      (CATEGORY_PRIORITY_MAP[this.category as keyof typeof CATEGORY_PRIORITY_MAP] as any) ||
      'medium';
  }

  next();
});

// 静的メソッド：優先度の自動判定
ReportSchema.statics.calculatePriority = function (report: Partial<IReport>) {
  // ハラスメント・著作権侵害は高優先度
  if (['harassment', 'copyright'].includes(report.category || '')) {
    return 'high';
  }

  // 複数の通報がある対象は優先度を上げる
  // （実装時に集計ロジックを追加）

  return CATEGORY_PRIORITY_MAP[report.category as keyof typeof CATEGORY_PRIORITY_MAP] || 'medium';
};

const Report = models.Report || model<IReport>('Report', ReportSchema);

export default Report;
