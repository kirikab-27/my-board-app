# リスク管理・ロールバック戦略

## 概要
会員制システム実装における各フェーズのリスク分析と、問題発生時の迅速な復旧を可能にするロールバック戦略を定義します。

## フェーズ別リスク分析

### Phase 0: テスト基盤

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| CI/CDパイプライン障害 | 中 | 低 | ローカルテスト環境の維持 |
| テストフレームワーク互換性問題 | 低 | 中 | 段階的導入、バージョン固定 |
| カバレッジ目標未達成 | 低 | 中 | 段階的な目標引き上げ |

### Phase 0.5: 観測基盤

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| モニタリングツールのオーバーヘッド | 中 | 中 | サンプリングレート調整 |
| 個人情報の誤送信 | 高 | 低 | データマスキング実装 |
| アラート疲れ | 中 | 高 | 閾値の段階的調整 |

### Phase 1: 認証基盤

| リスク | 影響度 | 発生確率 | 対策 | 詳細対策 |
|--------|--------|----------|------|----------|
| **認証基盤の不具合で全体停止** | 極高 | 中 | **段階的カナリアリリース** | 5%→25%→50%→100%展開 |
| パスワードハッシュ化の実装ミス | 極高 | 低 | 複数レビュー、既存ライブラリ使用 | bcryptjs使用、saltRounds:12 |
| セッション管理の脆弱性 | 高 | 中 | セキュリティテスト実施 | OWASP準拠テスト |

### Phase 2: メール認証

| リスク | 影響度 | 発生確率 | 対策 | 詳細対策 |
|--------|--------|----------|------|----------|
| **メール不達による登録不可** | 高 | 中 | **フォールバック認証準備** | 管理者承認、SMS認証 |
| SMTP制限による送信失敗 | 中 | 高 | レート制限実装、キュー処理 | 1秒/1通、再送信機能 |
| 認証トークン漏洩 | 極高 | 低 | 有効期限設定、HTTPS必須 | 24時間期限、ワンタイム |

### Phase 3: 会員投稿

| リスク | 影響度 | 発生確率 | 対策 | 詳細対策 |
|--------|--------|----------|------|----------|
| **権限バグによる情報漏洩** | 極高 | 中 | **徹底的アクセス制御テスト** | 権限マトリックステスト |
| 他ユーザー投稿の誤編集 | 高 | 中 | 投稿者IDの厳密チェック | サーバーサイド検証 |
| 大量投稿によるスパム | 中 | 高 | レート制限、スパムフィルター | 10投稿/時間制限 |

### Phase 4: UI改善

| リスク | 影響度 | 発生確率 | 対策 | 詳細対策 |
|--------|--------|----------|------|----------|
| **UX悪化による離脱率上昇** | 高 | 中 | **A/Bテスト検証** | 新旧UI並行運用 |
| レスポンシブ対応不備 | 中 | 中 | デバイステスト実施 | 実機テスト必須 |
| ローディング時間増加 | 中 | 高 | パフォーマンス監視 | 3秒以内目標 |

### Phase 5: セキュリティ

| リスク | 影響度 | 発生確率 | 対策 | 詳細対策 |
|--------|--------|----------|------|----------|
| **過度な制限による利便性低下** | 中 | 高 | **段階的制限強化** | 緩→厳への調整 |
| CSRF攻撃 | 高 | 低 | トークン検証実装 | NextAuth標準機能 |
| ブルートフォース攻撃 | 高 | 中 | レート制限、アカウントロック | 5回失敗で15分ロック |

## ロールバック戦略

### 1. データベースロールバック

#### スクリプト構成
```javascript
// scripts/rollback/phase-1/db-rollback.js
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

class DatabaseRollback {
  constructor(phase) {
    this.phase = phase;
    this.backupPath = `./backups/phase-${phase}`;
  }
  
  async createBackup() {
    console.log(`Creating backup for Phase ${this.phase}...`);
    
    const timestamp = new Date().toISOString();
    const backupName = `backup-${this.phase}-${timestamp}`;
    
    // mongodumpコマンド実行
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(
        `mongodump --uri="${process.env.MONGODB_URI}" --out="${this.backupPath}/${backupName}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Backup failed: ${error}`);
            reject(error);
          } else {
            console.log(`Backup created: ${backupName}`);
            resolve(backupName);
          }
        }
      );
    });
  }
  
  async rollback(targetBackup) {
    console.log(`Rolling back to: ${targetBackup}...`);
    
    // 現在の状態をバックアップ
    await this.createBackup();
    
    // mongorestoreコマンド実行
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(
        `mongorestore --uri="${process.env.MONGODB_URI}" --drop "${this.backupPath}/${targetBackup}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Rollback failed: ${error}`);
            reject(error);
          } else {
            console.log(`Rollback completed`);
            resolve();
          }
        }
      );
    });
  }
  
  async removePhaseChanges() {
    const changes = this.getPhaseChanges();
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db();
      
      for (const change of changes) {
        switch (change.type) {
          case 'collection':
            await db.dropCollection(change.name);
            console.log(`Dropped collection: ${change.name}`);
            break;
            
          case 'index':
            await db.collection(change.collection).dropIndex(change.name);
            console.log(`Dropped index: ${change.name}`);
            break;
            
          case 'field':
            await db.collection(change.collection).updateMany(
              {},
              { $unset: { [change.name]: "" } }
            );
            console.log(`Removed field: ${change.name}`);
            break;
        }
      }
    } finally {
      await client.close();
    }
  }
  
  getPhaseChanges() {
    const phaseChanges = {
      1: [
        { type: 'collection', name: 'users' },
        { type: 'collection', name: 'accounts' },
        { type: 'collection', name: 'sessions' },
        { type: 'index', collection: 'users', name: 'email_1' },
      ],
      2: [
        { type: 'collection', name: 'verificationtokens' },
        { type: 'field', collection: 'users', name: 'emailVerified' },
      ],
      3: [
        { type: 'field', collection: 'posts', name: 'userId' },
        { type: 'field', collection: 'posts', name: 'authorName' },
        { type: 'index', collection: 'posts', name: 'userId_1' },
      ],
    };
    
    return phaseChanges[this.phase] || [];
  }
}

// 実行
const phase = process.argv[2];
if (!phase) {
  console.error('Usage: node db-rollback.js <phase>');
  process.exit(1);
}

const rollback = new DatabaseRollback(phase);
rollback.removePhaseChanges()
  .then(() => console.log('Database rollback completed'))
  .catch(console.error);
```

### 2. 環境変数ロールバック

#### 環境変数管理スクリプト
```bash
#!/bin/bash
# scripts/rollback/env-rollback.sh

PHASE=$1
ENV_BACKUP_DIR="./backups/env"

# バックアップ作成
backup_env() {
  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_file="${ENV_BACKUP_DIR}/env_backup_phase_${PHASE}_${timestamp}"
  
  cp .env.local "$backup_file"
  echo "Environment backed up to: $backup_file"
}

# Phase別の環境変数削除
rollback_env() {
  case $PHASE in
    1)
      # NextAuth関連の削除
      sed -i '/NEXTAUTH_URL/d' .env.local
      sed -i '/NEXTAUTH_SECRET/d' .env.local
      ;;
    2)
      # メール認証関連の削除
      sed -i '/EMAIL_VERIFICATION/d' .env.local
      sed -i '/RESET_PASSWORD/d' .env.local
      ;;
    0.5)
      # モニタリング関連の削除
      sed -i '/SENTRY_DSN/d' .env.local
      sed -i '/SLACK_WEBHOOK/d' .env.local
      ;;
  esac
  
  echo "Environment variables rolled back for Phase $PHASE"
}

# 実行
backup_env
rollback_env
```

### 3. コードロールバック

#### Gitベースのロールバック
```bash
#!/bin/bash
# scripts/rollback/code-rollback.sh

PHASE=$1

# Phase開始時のタグを取得
get_phase_tag() {
  case $PHASE in
    0) echo "phase-0-start" ;;
    0.5) echo "phase-0.5-start" ;;
    1) echo "phase-1-start" ;;
    2) echo "phase-2-start" ;;
    3) echo "phase-3-start" ;;
    4) echo "phase-4-start" ;;
    5) echo "phase-5-start" ;;
    *) echo "unknown" ;;
  esac
}

# ロールバック実行
rollback_code() {
  tag=$(get_phase_tag)
  
  if [ "$tag" = "unknown" ]; then
    echo "Unknown phase: $PHASE"
    exit 1
  fi
  
  # 現在の状態を保存
  git stash push -m "Rollback from Phase $PHASE"
  
  # タグにチェックアウト
  git checkout "$tag"
  
  echo "Code rolled back to: $tag"
  echo "Stashed changes can be recovered with: git stash pop"
}

# 実行
rollback_code
```

## カナリアリリース実装

```typescript
// src/lib/deployment/canary-release.ts
export class CanaryRelease {
  private rolloutPercentages = [5, 25, 50, 100];
  private monitoringDuration = 60 * 60 * 1000; // 1時間
  
  async deploy(phase: number) {
    console.log(`Starting canary release for Phase ${phase}`);
    
    for (const percentage of this.rolloutPercentages) {
      console.log(`Rolling out to ${percentage}% of users`);
      
      // フィーチャーフラグ更新
      await this.updateFeatureFlag(phase, percentage);
      
      // モニタリング
      const startTime = Date.now();
      while (Date.now() - startTime < this.monitoringDuration) {
        const metrics = await this.collectMetrics();
        
        if (this.detectAnomaly(metrics)) {
          console.error('Anomaly detected, rolling back');
          await this.rollback(phase);
          throw new Error(`Canary release failed at ${percentage}%`);
        }
        
        await this.sleep(10000); // 10秒ごとにチェック
      }
      
      console.log(`${percentage}% rollout successful`);
    }
    
    console.log('Canary release completed successfully');
  }
  
  private async updateFeatureFlag(phase: number, percentage: number) {
    // フィーチャーフラグサービス（LaunchDarkly等）の更新
    const flag = `phase_${phase}_enabled`;
    
    // ユーザーIDのハッシュ値で判定
    const rule = {
      variation: true,
      weight: percentage,
    };
    
    // 実際のフラグ更新処理
    console.log(`Feature flag ${flag} updated to ${percentage}%`);
  }
  
  private async collectMetrics() {
    // メトリクス収集
    return {
      errorRate: await this.getErrorRate(),
      responseTime: await this.getAverageResponseTime(),
      successRate: await this.getSuccessRate(),
      userFeedback: await this.getUserFeedback(),
    };
  }
  
  private detectAnomaly(metrics: any): boolean {
    // 異常検知ロジック
    const thresholds = {
      errorRate: 0.05,      // 5%以上でアノマリー
      responseTime: 1000,   // 1秒以上でアノマリー
      successRate: 0.95,    // 95%未満でアノマリー
    };
    
    if (metrics.errorRate > thresholds.errorRate) {
      console.error(`High error rate: ${metrics.errorRate}`);
      return true;
    }
    
    if (metrics.responseTime > thresholds.responseTime) {
      console.error(`Slow response time: ${metrics.responseTime}ms`);
      return true;
    }
    
    if (metrics.successRate < thresholds.successRate) {
      console.error(`Low success rate: ${metrics.successRate}`);
      return true;
    }
    
    return false;
  }
  
  private async rollback(phase: number) {
    // フィーチャーフラグを0%に
    await this.updateFeatureFlag(phase, 0);
    
    // ロールバックスクリプト実行
    const { exec } = require('child_process');
    exec(`npm run rollback:phase-${phase}`, (error, stdout, stderr) => {
      console.log('Rollback executed:', stdout);
      if (error) {
        console.error('Rollback error:', error);
      }
    });
  }
  
  private async getErrorRate(): Promise<number> {
    // Sentryからエラー率取得
    return 0.01; // 仮実装
  }
  
  private async getAverageResponseTime(): Promise<number> {
    // APMツールから応答時間取得
    return 250; // 仮実装
  }
  
  private async getSuccessRate(): Promise<number> {
    // 成功率計算
    return 0.99; // 仮実装
  }
  
  private async getUserFeedback(): Promise<any> {
    // ユーザーフィードバック取得
    return { satisfaction: 4.5 }; // 仮実装
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 緊急対応手順

### 1. インシデント発生時の初動

```markdown
## 緊急対応チェックリスト

### 即座の対応（5分以内）
- [ ] 影響範囲の特定
- [ ] アラート内容の確認
- [ ] ユーザー影響の評価
- [ ] ロールバック必要性の判断

### 初期対応（15分以内）
- [ ] ステークホルダーへの通知
- [ ] 一時的な対策の実施
- [ ] ロールバック実行（必要な場合）
- [ ] モニタリング強化

### 復旧作業（30分以内）
- [ ] 根本原因の特定
- [ ] 恒久対策の検討
- [ ] テスト環境での検証
- [ ] 本番環境への適用

### 事後対応（1時間以内）
- [ ] インシデントレポート作成
- [ ] 再発防止策の策定
- [ ] ドキュメント更新
- [ ] 関係者への報告
```

### 2. ロールバック判断基準

| 状況 | ロールバック | 対応 |
|------|-------------|------|
| エラー率 > 10% | 必須 | 即座に実行 |
| エラー率 5-10% | 推奨 | 15分監視後判断 |
| 応答時間 > 3秒 | 推奨 | 原因調査後判断 |
| ユーザークレーム多数 | 検討 | 内容精査後判断 |
| セキュリティ脆弱性 | 必須 | 即座に実行 |

## リスク軽減のベストプラクティス

### 1. 事前準備
- ロールバックスクリプトの事前テスト
- バックアップの定期実行と検証
- ステージング環境での十分なテスト
- ランブック（手順書）の整備

### 2. 段階的展開
- フィーチャーフラグの活用
- カナリアリリースの実施
- A/Bテストによる検証
- 段階的な負荷増加

### 3. 監視強化
- デプロイ前後のメトリクス比較
- アラート閾値の適切な設定
- ユーザーフィードバックの収集
- エラーログの詳細分析

### 4. コミュニケーション
- ステークホルダーへの事前通知
- 変更内容の明確な文書化
- インシデント時の連絡体制確立
- 定期的な振り返り会議

## まとめ

このリスク管理戦略により：
- **予防**: 事前のリスク分析で問題を未然に防ぐ
- **検知**: 早期の異常検知で影響を最小化
- **回復**: 迅速なロールバックで正常状態に復帰
- **改善**: インシデントから学習し継続的改善

各フェーズで適切なリスク管理を行うことで、安全で信頼性の高い会員制システムの構築が可能になります。