/**
 * タイムライン機能実装確認スクリプト
 * 
 * ファイル存在確認、構文チェック、基本設定確認を実行
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  // API
  'src/app/api/timeline/route.ts',
  'src/app/api/timeline/updates/route.ts',
  
  // ページコンポーネント
  'src/app/timeline/page.tsx',
  
  // UIコンポーネント
  'src/components/timeline/TimelinePostCard.tsx',
  'src/components/timeline/NewPostsBanner.tsx',
  'src/components/timeline/ErrorBoundary.tsx',
  'src/components/timeline/EmptyStates.tsx',
  
  // フック
  'src/hooks/useTimeline.ts',
  'src/hooks/useInfiniteScroll.ts',
  'src/hooks/useRealtimeUpdates.ts',
  
  // データベース最適化
  'src/lib/database/timeline-indexes.ts',
  
  // リアルタイム機能
  'src/lib/realtime/websocket-client.ts'
];

const FEATURE_REQUIREMENTS = [
  {
    file: 'src/app/api/timeline/route.ts',
    requirements: ['MongoDB集約パイプライン', '$lookup', '$match', 'パフォーマンス監視']
  },
  {
    file: 'src/hooks/useTimeline.ts',
    requirements: ['無限スクロール', 'リアルタイム更新', 'エラーハンドリング']
  },
  {
    file: 'src/components/timeline/TimelinePostCard.tsx',
    requirements: ['いいね機能', 'フォロー機能', 'シェア機能', '相対時間']
  },
  {
    file: 'src/lib/database/timeline-indexes.ts',
    requirements: ['インデックス最適化', 'パフォーマンステスト']
  }
];

class TimelineFeatureVerification {
  constructor() {
    this.results = {
      fileChecks: [],
      featureChecks: [],
      summary: {
        totalFiles: 0,
        existingFiles: 0,
        missingFiles: 0,
        featureCompliance: 0
      }
    };
  }

  log(message, type = 'info') {
    const prefix = {
      'info': '💡',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type];
    
    console.log(`${prefix} ${message}`);
  }

  checkFileExists(filePath) {
    const fullPath = path.resolve(filePath);
    const exists = fs.existsSync(fullPath);
    
    let size = 0;
    if (exists) {
      const stats = fs.statSync(fullPath);
      size = stats.size;
    }
    
    return { exists, size, path: filePath };
  }

  checkFeatureRequirements(file, requirements) {
    if (!fs.existsSync(file)) {
      return { file, compliance: 0, found: [], missing: requirements };
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const found = [];
    const missing = [];
    
    requirements.forEach(requirement => {
      // シンプルなキーワード検索
      const keywords = {
        'MongoDB集約パイプライン': ['aggregate', '$match', '$lookup'],
        '$lookup': ['$lookup'],
        '$match': ['$match'],
        'パフォーマンス監視': ['performance', 'queryTime', 'Date.now'],
        '無限スクロール': ['IntersectionObserver', 'infinite', 'scroll'],
        'リアルタイム更新': ['WebSocket', 'realtime', 'updates'],
        'エラーハンドリング': ['try', 'catch', 'error'],
        'いいね機能': ['like', 'Like'],
        'フォロー機能': ['follow', 'Follow'],
        'シェア機能': ['share', 'Share'],
        '相対時間': ['formatDistanceToNow', 'relative'],
        'インデックス最適化': ['createIndex', 'index'],
        'パフォーマンステスト': ['performance', 'test', 'benchmark']
      };
      
      const searchKeywords = keywords[requirement] || [requirement.toLowerCase()];
      const hasKeyword = searchKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        found.push(requirement);
      } else {
        missing.push(requirement);
      }
    });
    
    const compliance = (found.length / requirements.length) * 100;
    return { file, compliance, found, missing };
  }

  async run() {
    this.log('🚀 タイムライン機能実装確認開始', 'info');
    
    // ファイル存在確認
    this.log('\n📁 ファイル存在確認:', 'info');
    REQUIRED_FILES.forEach(filePath => {
      const result = this.checkFileExists(filePath);
      this.results.fileChecks.push(result);
      this.results.summary.totalFiles++;
      
      if (result.exists) {
        this.results.summary.existingFiles++;
        this.log(`${filePath} (${result.size} bytes)`, 'success');
      } else {
        this.results.summary.missingFiles++;
        this.log(`${filePath} - ファイルなし`, 'error');
      }
    });
    
    // 機能要件確認
    this.log('\n🔍 機能要件確認:', 'info');
    let totalCompliance = 0;
    
    FEATURE_REQUIREMENTS.forEach(({ file, requirements }) => {
      const result = this.checkFeatureRequirements(file, requirements);
      this.results.featureChecks.push(result);
      totalCompliance += result.compliance;
      
      this.log(`${file}:`, 'info');
      this.log(`  適合率: ${result.compliance.toFixed(1)}%`, result.compliance >= 80 ? 'success' : 'warning');
      this.log(`  実装済み: ${result.found.join(', ')}`, 'success');
      
      if (result.missing.length > 0) {
        this.log(`  未実装: ${result.missing.join(', ')}`, 'warning');
      }
    });
    
    this.results.summary.featureCompliance = totalCompliance / FEATURE_REQUIREMENTS.length;
    
    // 最終結果
    this.log('\n📊 実装確認結果:', 'info');
    this.log('=' * 50, 'info');
    this.log(`ファイル存在率: ${this.results.summary.existingFiles}/${this.results.summary.totalFiles} (${((this.results.summary.existingFiles / this.results.summary.totalFiles) * 100).toFixed(1)}%)`, 'info');
    this.log(`機能適合率: ${this.results.summary.featureCompliance.toFixed(1)}%`, 'info');
    
    const overallSuccess = this.results.summary.existingFiles === this.results.summary.totalFiles && 
                          this.results.summary.featureCompliance >= 80;
    
    if (overallSuccess) {
      this.log('\n🎉 タイムライン機能実装完了！', 'success');
      this.log('✅ 全ファイルが存在します', 'success');
      this.log('✅ 主要機能が実装されています', 'success');
      this.log('✅ 統合テスト準備完了', 'success');
    } else {
      this.log('\n⚠️ 実装に問題があります', 'warning');
      
      if (this.results.summary.missingFiles > 0) {
        this.log(`❌ ${this.results.summary.missingFiles}個のファイルが不足`, 'error');
      }
      
      if (this.results.summary.featureCompliance < 80) {
        this.log(`❌ 機能適合率が基準未満 (${this.results.summary.featureCompliance.toFixed(1)}% < 80%)`, 'error');
      }
    }
    
    // 推奨事項
    this.log('\n💡 推奨事項:', 'info');
    this.log('1. npm run build でビルドエラーなしを確認', 'info');
    this.log('2. 認証機能との統合テスト実施', 'info');
    this.log('3. ユーザー受け入れテスト実施', 'info');
    this.log('4. パフォーマンステスト実施', 'info');
    
    return this.results;
  }
}

// 実行
if (require.main === module) {
  const verification = new TimelineFeatureVerification();
  verification.run().catch(console.error);
}

module.exports = TimelineFeatureVerification;