# 運用マニュアル

## 1. 運用概要

### 1.1 システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ユーザー        │    │   Vercel         │    │ MongoDB Atlas   │
│   (ブラウザ)      │◄──►│   (Hosting)      │◄──►│  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 運用チームの役割

| 役割 | 責任範囲 | 頻度 |
|------|----------|------|
| **システム管理者** | サーバー監視、デプロイ管理 | 24/7 |
| **開発者** | コード修正、機能追加 | 平日 |
| **データベース管理者** | DB最適化、バックアップ管理 | 毎日 |

### 1.3 運用時間とメンテナンス

```
通常運用: 24時間365日
定期メンテナンス: 毎週日曜日 02:00-04:00 JST
緊急メンテナンス: 必要に応じて
```

## 2. 日常的なメンテナンス作業

### 2.1 日次確認作業（毎朝9:00実施）

#### システムヘルスチェック
```bash
# サイトアクセス確認
curl -I https://your-board-app.vercel.app
# 期待値: HTTP/2 200

# APIエンドポイント確認
curl https://your-board-app.vercel.app/api/posts
# 期待値: 投稿データのJSON配列
```

#### パフォーマンス確認
```bash
# PageSpeed Insights APIを使用
npx @lhci/cli autorun --upload.target=temporary-public-storage

# またはWeb版で確認
# https://pagespeed.web.dev/analysis?url=https://your-board-app.vercel.app
```

#### ダッシュボード確認項目
- [ ] Vercelデプロイメント状況
- [ ] MongoDB Atlas接続数
- [ ] エラーログの有無
- [ ] 新規投稿の動作確認

### 2.2 週次確認作業（毎週月曜日10:00実施）

#### データベース状況確認
```javascript
// MongoDB Atlasダッシュボードで確認
- ストレージ使用量
- 接続数の推移
- スロークエリの有無
- インデックス使用状況
```

#### セキュリティ確認
```bash
# npm audit実行
npm audit

# 依存関係の脆弱性チェック
npm audit fix

# Dependabotアラート確認（GitHub）
```

#### パフォーマンス分析
```javascript
// Vercel Analyticsで確認
- ページビュー数
- ユニークビジター数
- ページロード時間
- Core Web Vitals
```

### 2.3 月次確認作業（毎月第1営業日実施）

#### 利用状況レポート作成
```javascript
// MongoDB Atlasメトリクス
db.posts.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": -1, "_id.month": -1 } }
])
```

#### コスト確認
- Vercel使用量と請求額
- MongoDB Atlas使用量と請求額
- その他サービス（Sentry等）の使用量

#### セキュリティ更新
- Next.js、React等主要ライブラリの更新確認
- セキュリティパッチの適用計画

## 3. バックアップ手順

### 3.1 MongoDB Atlasバックアップ

#### 自動バックアップ設定確認
```bash
# MongoDB Atlasダッシュボードで確認
1. Clusters → [クラスター名] → Backup
2. Backup Status: Enabled 確認
3. Snapshot Schedule確認
   - Snapshot Frequency: Every 12 hours
   - Retention Period: 7 days
```

#### 手動バックアップ実行
```bash
# MongoDB Compassまたはコマンドラインから
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/board-app" --out="./backup/$(date +%Y%m%d_%H%M%S)"

# または Atlas Data API使用
curl -X POST \
  "https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1/action/find" \
  -H "Content-Type: application/json" \
  -H "api-key: your-api-key" \
  -d '{
    "dataSource": "Cluster0",
    "database": "board-app",
    "collection": "posts"
  }'
```

#### バックアップ検証
```bash
# バックアップデータの整合性確認
mongorestore --uri="mongodb://localhost:27017/test-restore" --dir="./backup/20250120_100000"

# レコード数確認
mongo test-restore --eval "db.posts.count()"
```

### 3.2 コードバックアップ

#### Git管理の確認
```bash
# リモートリポジトリ同期確認
git status
git remote -v
git log --oneline -10

# バックアップリポジトリ設定（複数拠点）
git remote add backup https://github.com/backup-org/my-board-app.git
git push backup main
```

#### 設定ファイルバックアップ
```bash
# 重要設定ファイルのバックアップ
mkdir -p backup/config/$(date +%Y%m%d)
cp next.config.js backup/config/$(date +%Y%m%d)/
cp package.json backup/config/$(date +%Y%m%d)/
cp tsconfig.json backup/config/$(date +%Y%m%d)/
```

### 3.3 復旧手順

#### データベース復旧
```bash
# Step 1: 復旧対象の確認
mongosh "mongodb+srv://cluster.mongodb.net/board-app" \
  --eval "db.posts.find().sort({createdAt:-1}).limit(1)"

# Step 2: バックアップから復旧
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/board-app" \
  --dir="./backup/20250120_100000" \
  --drop

# Step 3: データ整合性確認
mongosh "mongodb+srv://cluster.mongodb.net/board-app" \
  --eval "db.posts.count()"
```

#### アプリケーション復旧
```bash
# Step 1: 安定版へのロールバック
vercel rollback [deployment-url]

# Step 2: または特定コミットへのデプロイ
git checkout [stable-commit-hash]
vercel --prod

# Step 3: 動作確認
curl -I https://your-board-app.vercel.app
```

## 4. ログの確認方法

### 4.1 アプリケーションログ

#### Vercelログ確認
```bash
# Vercel CLI経由
vercel logs --follow

# 特定期間のログ取得
vercel logs --since=1h

# エラーログのみフィルタ
vercel logs | grep -i error

# Webダッシュボード
# https://vercel.com/dashboard → プロジェクト → Functions → Logs
```

#### ログの解析例
```bash
# API エラーの集計
vercel logs --since=24h | grep "api/posts" | grep "error" | wc -l

# レスポンス時間の分析
vercel logs --since=1h | grep "duration:" | awk '{print $NF}' | sort -n
```

### 4.2 データベースログ

#### MongoDB Atlasログ確認
```javascript
// Atlas Dashboard → Clusters → Metrics
1. Primary Operations: 読み書き操作数
2. Network: データ転送量
3. Connections: 接続数推移
4. Opcounters: 操作種別統計
```

#### スロークエリ監視
```javascript
// Atlas → Performance Advisor
1. Index Suggestions: インデックス推奨
2. Slow Operations: 遅いクエリ一覧
3. Real Time Performance Panel: リアルタイム監視
```

### 4.3 エラー監視（Sentry）

#### Sentry設定
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // 本番環境のみ送信
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});
```

#### エラー分析ダッシュボード
```
Sentry Dashboard確認項目:
- Error Rate: エラー発生率
- Error Volume: エラー総数
- Top Issues: 頻発エラー
- Performance: パフォーマンス問題
```

## 5. パフォーマンスモニタリング

### 5.1 Core Web Vitals監視

#### 自動監視設定
```javascript
// src/app/layout.tsx
export function reportWebVitals(metric) {
  // Google Analytics送信
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
  
  // コンソール出力（開発環境）
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
}
```

#### パフォーマンス基準値
```javascript
// 目標値
const PERFORMANCE_TARGETS = {
  LCP: 2500,    // Largest Contentful Paint
  FID: 100,     // First Input Delay  
  CLS: 0.1,     // Cumulative Layout Shift
  TTFB: 800,    // Time to First Byte
};
```

### 5.2 データベースパフォーマンス

#### 重要メトリクス
```javascript
// 監視対象
1. Query Execution Time: クエリ実行時間
2. Index Hit Ratio: インデックス使用率
3. Connection Pool Usage: 接続プール使用率
4. Document Scan Rate: ドキュメントスキャン率
```

#### 最適化クエリ例
```javascript
// 投稿一覧取得の最適化
// 現在
db.posts.find({}).sort({createdAt: -1}).limit(20)

// 最適化後（インデックス追加）
db.posts.createIndex({createdAt: -1})
db.posts.find({}).sort({createdAt: -1}).limit(20).hint({createdAt: -1})
```

### 5.3 アラート設定

#### Vercel Integration設定
```javascript
// vercel.json
{
  "functions": {
    "app/api/posts/route.ts": {
      "maxDuration": 10
    }
  },
  "monitoring": {
    "alerts": {
      "errorRate": {
        "threshold": 0.05,
        "period": "5m"
      },
      "responseTime": {
        "threshold": 3000,
        "period": "1m"
      }
    }
  }
}
```

#### MongoDB Atlas アラート
```yaml
# アラート設定例
Disk Usage: > 80%
Connection Count: > 80% of maximum
Query Execution Time: > 1000ms
Error Rate: > 5%
```

## 6. セキュリティ監視

### 6.1 定期セキュリティチェック

#### 毎週実施項目
```bash
# 依存関係の脆弱性チェック
npm audit

# セキュリティアップデート確認
npm outdated

# SSL証明書有効期限確認
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### セキュリティヘッダー確認
```bash
# セキュリティヘッダーテスト
curl -I https://your-board-app.vercel.app | grep -E "(X-Frame|X-Content|CSP|HSTS)"

# またはオンラインツール使用
# https://securityheaders.com/
```

### 6.2 アクセス監視

#### 異常アクセス検出
```bash
# Vercel Analyticsで確認
1. Unusual Traffic Patterns: 異常なトラフィック
2. Geographic Distribution: 地理的分布
3. Referrer Analysis: 参照元分析
4. Bot Traffic: ボットトラフィック検出
```

#### Rate Limiting実装
```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimiter = new Map();

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分間
  const maxRequests = 100; // 最大100リクエスト

  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  const limit = rateLimiter.get(ip);
  
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
  } else {
    limit.count++;
  }

  if (limit.count > maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

## 7. 障害対応手順

### 7.1 障害レベル定義

| レベル | 説明 | 対応時間目標 | エスカレーション |
|--------|------|-------------|----------------|
| **Critical** | サービス全停止 | 15分以内 | 即座にチームリーダーへ |
| **High** | 主要機能停止 | 1時間以内 | 30分以内にリーダーへ |
| **Medium** | 一部機能影響 | 4時間以内 | 2時間以内にリーダーへ |
| **Low** | 軽微な問題 | 1営業日以内 | 定例報告 |

### 7.2 障害対応フロー

#### Step 1: 初期対応（5分以内）
```bash
# 1. 症状確認
curl -I https://your-board-app.vercel.app
curl https://your-board-app.vercel.app/api/posts

# 2. ダッシュボード確認
# - Vercel Status
# - MongoDB Atlas Status  
# - 外部サービス状況

# 3. 関係者への初報
# Slack/Teams/メールで障害報告
```

#### Step 2: 詳細調査（15分以内）
```bash
# ログ分析
vercel logs --since=30m | grep -i error

# データベース接続確認
mongosh "mongodb+srv://cluster.mongodb.net/board-app" --eval "db.runCommand('ping')"

# パフォーマンス確認
curl -w "@curl-format.txt" -o /dev/null -s https://your-board-app.vercel.app
```

#### Step 3: 応急処置（30分以内）
```bash
# 安定版へのロールバック
vercel rollback [previous-deployment-url]

# または設定変更
# 環境変数の修正
# DNS設定の確認
```

#### Step 4: 恒久対策（1週間以内）
```bash
# 根本原因の特定
# コード修正
# テスト実施
# 再発防止策の実装
```

### 7.3 障害事例と対処法

#### Case 1: データベース接続エラー
```bash
# 症状
Error: MongooseServerSelectionError

# 確認手順
1. MongoDB Atlas Status確認
2. IPホワイトリスト確認
3. 接続文字列確認
4. ネットワーク疎通確認

# 対処法
# 一時的な接続文字列変更
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production
[新しい接続文字列を入力]
```

#### Case 2: メモリ不足エラー
```bash
# 症状  
JavaScript heap out of memory

# 対処法
# next.config.js修正
module.exports = {
  experimental: {
    outputStandalone: true,
  },
  // メモリ使用量最適化
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

## 8. レポート作成

### 8.1 日次レポート

#### 自動化スクリプト例
```bash
#!/bin/bash
# daily-report.sh

DATE=$(date +%Y-%m-%d)
REPORT_FILE="reports/daily-report-$DATE.md"

echo "# Daily Report - $DATE" > $REPORT_FILE
echo "" >> $REPORT_FILE

# サイトステータス確認
echo "## Site Status" >> $REPORT_FILE
if curl -f -s https://your-board-app.vercel.app > /dev/null; then
  echo "✅ Site is UP" >> $REPORT_FILE
else
  echo "❌ Site is DOWN" >> $REPORT_FILE
fi

# 新規投稿数
echo "## New Posts" >> $REPORT_FILE
# MongoDB集計クエリ結果を追加

# エラー数
echo "## Errors (Last 24h)" >> $REPORT_FILE
ERROR_COUNT=$(vercel logs --since=24h | grep -i error | wc -l)
echo "Error Count: $ERROR_COUNT" >> $REPORT_FILE

# Slackに送信
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Daily Report Generated: '$DATE'"}' \
  $SLACK_WEBHOOK_URL
```

### 8.2 週次レポート

#### テンプレート
```markdown
# Weekly Report - Week of YYYY-MM-DD

## Summary
- Uptime: 99.9%
- Total Posts: 1,234 (+56 from last week)
- Unique Visitors: 567 (+23 from last week)
- Average Response Time: 234ms

## Issues
- 2 minor issues resolved
- 0 critical issues

## Performance
- Lighthouse Score: 95/100
- Core Web Vitals: All Green

## Actions for Next Week
- [ ] Update dependencies
- [ ] Review slow queries
- [ ] Plan feature deployment
```

### 8.3 月次レポート

#### KPI ダッシュボード
```javascript
// MongoDB Analytics Query
const monthlyStats = await db.posts.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  },
  {
    $group: {
      _id: { $dayOfMonth: "$createdAt" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);
```

この運用マニュアルに従って、安定したサービス運用を継続し、問題の早期発見・解決を図ることが重要です。