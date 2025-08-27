#!/usr/bin/env node

/**
 * タイムライン最適化インデックス作成スクリプト
 * 
 * 使用方法:
 * node scripts/optimize-timeline-indexes.js [--analyze] [--test] [--force]
 * 
 * オプション:
 * --analyze: インデックス使用状況分析のみ実行
 * --test: パフォーマンステスト実行
 * --force: 既存インデックスを削除して再作成
 */

const mongoose = require('mongoose');
const path = require('path');

// 環境変数の読み込み
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 動的import用のヘルパー
async function importModule(modulePath) {
  const module = await import(modulePath);
  return module;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldAnalyze = args.includes('--analyze');
  const shouldTest = args.includes('--test');
  const shouldForce = args.includes('--force');

  try {
    console.log('🚀 タイムライン最適化スクリプト開始');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB接続成功');

    // モジュールを動的インポート
    const timelineIndexes = await importModule('../src/lib/database/timeline-indexes.ts');
    
    if (shouldForce) {
      console.log('🗑️  既存インデックスを削除中...');
      await dropTimelineIndexes();
    }

    if (shouldAnalyze) {
      // インデックス分析のみ
      console.log('📊 インデックス使用状況分析を実行中...');
      const analysis = await timelineIndexes.analyzeIndexUsage();
      
      if (analysis) {
        console.log('\n📈 分析結果:');
        for (const [collection, data] of Object.entries(analysis)) {
          console.log(`\n${collection}:`);
          console.log(`  インデックス数: ${data.indexCount}`);
          
          if (data.usage.length > 0) {
            console.log('  使用状況:');
            data.usage.forEach(usage => {
              console.log(`    ${usage.name}: ${usage.ops} 回使用`);
            });
          }
        }
      }
    } else {
      // インデックス作成
      console.log('⚡ タイムライン最適化インデックスを作成中...');
      const result = await timelineIndexes.createTimelineIndexes();
      
      console.log('✅ インデックス作成完了:', result.message);
      console.log(`📊 作成されたインデックス数: ${result.indexesCreated}`);
    }

    if (shouldTest) {
      // パフォーマンステスト
      console.log('\n🧪 パフォーマンステストを実行中...');
      
      // テスト用のユーザーIDを取得（実際のユーザーから1人選択）
      const User = mongoose.model('User');
      const testUser = await User.findOne({}).select('_id');
      
      if (testUser) {
        const performance = await timelineIndexes.testTimelinePerformance(testUser._id.toString());
        
        console.log('\n⚡ パフォーマンステスト結果:');
        console.log(`  フォロー検索: ${performance.followLookupTime}ms`);
        console.log(`  タイムライン取得: ${performance.timelineQueryTime}ms`);
        console.log(`  合計時間: ${performance.totalTime}ms`);
        console.log(`  対象ユーザー数: ${performance.targetUsers}`);
        
        // パフォーマンス評価
        if (performance.totalTime < 100) {
          console.log('🚀 優秀: 100ms未満');
        } else if (performance.totalTime < 500) {
          console.log('✅ 良好: 500ms未満');
        } else if (performance.totalTime < 1000) {
          console.log('⚠️  要注意: 1秒未満');
        } else {
          console.log('❌ 要改善: 1秒以上');
        }
      } else {
        console.log('⚠️  テスト用ユーザーが見つからないため、パフォーマンステストをスキップします');
      }
    }

    // 推奨事項の表示
    console.log('\n💡 パフォーマンス最適化の推奨事項:');
    console.log('  1. 定期的にインデックス使用状況を分析してください');
    console.log('  2. 不要なインデックスは削除してください');
    console.log('  3. タイムライン取得時間が1秒を超える場合は最適化が必要です');
    console.log('  4. フォロー数が多いユーザーのパフォーマンスを監視してください');

    console.log('\n🎉 タイムライン最適化完了');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB接続を切断しました');
  }
}

// 既存インデックス削除
async function dropTimelineIndexes() {
  try {
    const collections = ['posts', 'follows', 'users'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collection(collectionName);
      const indexes = await collection.indexes();
      
      for (const index of indexes) {
        // _id インデックスは削除しない
        if (index.name !== '_id_') {
          try {
            await collection.dropIndex(index.name);
            console.log(`  削除: ${collectionName}.${index.name}`);
          } catch (err) {
            console.warn(`  スキップ: ${collectionName}.${index.name} (${err.message})`);
          }
        }
      }
    }
  } catch (error) {
    console.error('インデックス削除エラー:', error);
  }
}

// 使用方法表示
function showUsage() {
  console.log(`
使用方法: node scripts/optimize-timeline-indexes.js [オプション]

オプション:
  --analyze     インデックス使用状況分析のみ実行
  --test        パフォーマンステスト実行
  --force       既存インデックスを削除して再作成
  --help        このヘルプを表示

例:
  node scripts/optimize-timeline-indexes.js                    # インデックス作成
  node scripts/optimize-timeline-indexes.js --analyze          # 分析のみ
  node scripts/optimize-timeline-indexes.js --test             # テスト実行
  node scripts/optimize-timeline-indexes.js --force --test     # 強制再作成+テスト
`);
}

// ヘルプ表示
if (process.argv.includes('--help')) {
  showUsage();
  process.exit(0);
}

// スクリプト実行
main().catch(console.error);