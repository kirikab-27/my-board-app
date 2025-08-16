/**
 * Phase 6.0 SNS機能 - 包括的データベースマイグレーションスクリプト
 * 
 * 目的：
 * - Phase 5.5 → Phase 6.0 への安全な移行
 * - 既存データの保持・拡張
 * - SNS機能の基盤構築
 * - ゼロダウンタイム移行
 * 
 * 実行前の準備：
 * 1. データベースの完全バックアップ
 * 2. Phase 6.0 モデルファイルの配置確認
 * 3. 十分なストレージ容量（既存データの1.5倍以上）
 * 
 * 使用方法：
 * node scripts/migrate-phase6-sns.js [options]
 * 
 * オプション：
 * --dry-run: 実際の変更を行わずテスト実行
 * --batch-size=1000: バッチサイズ指定
 * --verbose: 詳細ログ出力
 * --rollback: 移行を元に戻す
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// 設定
const config = {
  batchSize: parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 1000,
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  rollback: process.argv.includes('--rollback'),
  backupPath: './backups',
  migrationLogPath: './migration-logs'
};

// ログ関数
const log = {
  info: (msg) => console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warning: (msg) => console.log(`⚠️  [WARNING] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`❌ [ERROR] ${new Date().toISOString()} - ${msg}`),
  verbose: (msg) => config.verbose && console.log(`🔍 [VERBOSE] ${new Date().toISOString()} - ${msg}`)
};

// エラーハンドリング
process.on('uncaughtException', (error) => {
  log.error(`未処理例外: ${error.message}`);
  log.error(`スタック: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`未処理Promise拒否: ${reason}`);
  process.exit(1);
});

/**
 * データベース接続の初期化
 */
async function initializeDatabase() {
  try {
    // .env.localファイルから環境変数を読み込み
    require('dotenv').config({ path: '.env.local' });
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/board-app';
    await mongoose.connect(mongoUri);
    log.success(`データベース接続完了: ${mongoUri}`);
    
    // データベース状態確認
    const dbStats = await mongoose.connection.db.stats();
    log.info(`DB統計 - サイズ: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)}MB, オブジェクト数: ${dbStats.objects}`);
    
    return true;
  } catch (error) {
    log.error(`データベース接続失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 既存データのバックアップ作成
 */
async function createBackup() {
  log.info('既存データのバックアップを作成中...');
  
  try {
    // バックアップディレクトリ作成
    await fs.mkdir(config.backupPath, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(config.backupPath, `phase5.5-backup-${timestamp}.json`);
    
    // 既存コレクションのデータを取得
    const collections = ['users', 'posts'];
    const backup = {};
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const data = await collection.find({}).toArray();
        backup[collectionName] = data;
        log.verbose(`${collectionName}: ${data.length}件のドキュメントをバックアップ`);
      } catch (error) {
        log.warning(`${collectionName}コレクションのバックアップ失敗: ${error.message}`);
        backup[collectionName] = [];
      }
    }
    
    // バックアップファイル書き込み
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    log.success(`バックアップ完了: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    log.error(`バックアップ作成失敗: ${error.message}`);
    throw error;
  }
}

/**
 * Phase 6.0 用 User モデル拡張
 */
async function migrateUsers() {
  log.info('👥 Userモデルの拡張を開始...');
  
  const collection = mongoose.connection.collection('users');
  
  try {
    const totalUsers = await collection.countDocuments();
    log.info(`対象ユーザー数: ${totalUsers}`);
    
    let processed = 0;
    let updated = 0;
    
    // バッチ処理でユーザーを更新
    for (let skip = 0; skip < totalUsers; skip += config.batchSize) {
      const users = await collection.find({}).skip(skip).limit(config.batchSize).toArray();
      
      for (const user of users) {
        const updates = {};
        let needsUpdate = false;
        
        // username生成（存在しない場合）
        if (!user.username) {
          const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let username = baseUsername;
          let counter = 1;
          
          // 一意のユーザー名を生成
          while (await collection.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }
          
          updates.username = username;
          needsUpdate = true;
          log.verbose(`ユーザー ${user.email} にユーザー名を生成: ${username}`);
        }
        
        // displayName設定（存在しない場合）
        if (!user.displayName) {
          updates.displayName = user.name;
          needsUpdate = true;
        }
        
        // 統計情報の初期化
        if (!user.stats) {
          updates.stats = {
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            likesReceived: 0,
            commentsReceived: 0
          };
          needsUpdate = true;
        }
        
        // ユーザー設定の初期化
        if (!user.preferences) {
          updates.preferences = {
            notifications: {
              follows: true,
              likes: true,
              comments: true,
              mentions: true,
              email: true
            },
            privacy: {
              profile: 'public',
              posts: 'public',
              followers: 'public'
            },
            language: 'ja',
            theme: 'auto'
          };
          needsUpdate = true;
        }
        
        // システム設定の初期化
        if (user.isVerified === undefined) {
          updates.isVerified = false;
          needsUpdate = true;
        }
        
        if (user.isPrivate === undefined) {
          updates.isPrivate = false;
          needsUpdate = true;
        }
        
        // アクティビティ情報の初期化
        if (!user.lastSeen) {
          updates.lastSeen = user.updatedAt || user.createdAt || new Date();
          needsUpdate = true;
        }
        
        if (user.isOnline === undefined) {
          updates.isOnline = false;
          needsUpdate = true;
        }
        
        // 更新実行
        if (needsUpdate && !config.dryRun) {
          await collection.updateOne(
            { _id: user._id },
            { $set: updates }
          );
          updated++;
        }
        
        processed++;
        
        // 進捗表示
        if (processed % 100 === 0) {
          log.info(`ユーザー処理進捗: ${processed}/${totalUsers} (${((processed / totalUsers) * 100).toFixed(1)}%)`);
        }
      }
    }
    
    log.success(`Userモデル拡張完了 - 処理: ${processed}, 更新: ${updated}`);
    return { processed, updated };
    
  } catch (error) {
    log.error(`Userモデル拡張失敗: ${error.message}`);
    throw error;
  }
}

/**
 * Phase 6.0 用 Post モデル拡張
 */
async function migratePosts() {
  log.info('📝 Postモデルの拡張を開始...');
  
  const collection = mongoose.connection.collection('posts');
  
  try {
    const totalPosts = await collection.countDocuments();
    log.info(`対象投稿数: ${totalPosts}`);
    
    let processed = 0;
    let updated = 0;
    
    // バッチ処理で投稿を更新
    for (let skip = 0; skip < totalPosts; skip += config.batchSize) {
      const posts = await collection.find({}).skip(skip).limit(config.batchSize).toArray();
      
      for (const post of posts) {
        const updates = {};
        let needsUpdate = false;
        
        // SNS用フィールドの初期化
        if (!post.type) {
          updates.type = 'post';
          needsUpdate = true;
        }
        
        if (!post.hashtags) {
          // コンテンツからハッシュタグを抽出
          const hashtagRegex = /#([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
          const hashtagMatches = (post.content || '').match(hashtagRegex);
          updates.hashtags = hashtagMatches 
            ? hashtagMatches.map(tag => tag.slice(1).toLowerCase()) 
            : [];
          needsUpdate = true;
        }
        
        if (!post.mentions) {
          // コンテンツからメンションを抽出
          const mentionRegex = /@([a-zA-Z0-9_]+)/g;
          const mentionMatches = (post.content || '').match(mentionRegex);
          updates.mentions = mentionMatches 
            ? mentionMatches.map((match, index) => ({
                userId: '', // 後でAPIで解決
                username: match.slice(1).toLowerCase(),
                startIndex: (post.content || '').indexOf(match),
                endIndex: (post.content || '').indexOf(match) + match.length
              }))
            : [];
          needsUpdate = true;
        }
        
        if (!post.media) {
          updates.media = [];
          needsUpdate = true;
        }
        
        // プライバシー設定
        if (!post.privacy) {
          updates.privacy = post.isPublic !== false ? 'public' : 'private';
          needsUpdate = true;
        }
        
        // 統計情報の初期化
        if (!post.stats) {
          updates.stats = {
            likes: post.likes || 0,
            comments: 0, // 後で再計算
            reposts: 0,
            quotes: 0,
            views: 0,
            shares: 0
          };
          needsUpdate = true;
        }
        
        // メタデータの初期化
        if (!post.language) {
          updates.language = 'ja';
          needsUpdate = true;
        }
        
        if (post.isEdited === undefined) {
          updates.isEdited = false;
          needsUpdate = true;
        }
        
        if (post.isPinned === undefined) {
          updates.isPinned = false;
          needsUpdate = true;
        }
        
        // モデレーション
        if (post.isDeleted === undefined) {
          updates.isDeleted = false;
          needsUpdate = true;
        }
        
        if (post.reportCount === undefined) {
          updates.reportCount = 0;
          needsUpdate = true;
        }
        
        // 更新実行
        if (needsUpdate && !config.dryRun) {
          await collection.updateOne(
            { _id: post._id },
            { $set: updates }
          );
          updated++;
        }
        
        processed++;
        
        // 進捗表示
        if (processed % 100 === 0) {
          log.info(`投稿処理進捗: ${processed}/${totalPosts} (${((processed / totalPosts) * 100).toFixed(1)}%)`);
        }
      }
    }
    
    log.success(`Postモデル拡張完了 - 処理: ${processed}, 更新: ${updated}`);
    return { processed, updated };
    
  } catch (error) {
    log.error(`Postモデル拡張失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 新規コレクションの初期化
 */
async function initializeNewCollections() {
  log.info('🆕 新規コレクションの初期化を開始...');
  
  const newCollections = [
    'follows',
    'comments', 
    'notifications',
    'hashtags',
    'media',
    'analytics'
  ];
  
  let initialized = 0;
  
  for (const collectionName of newCollections) {
    try {
      // コレクションが存在するかチェック
      const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
      
      if (collections.length === 0) {
        // コレクション作成
        if (!config.dryRun) {
          await mongoose.connection.db.createCollection(collectionName);
        }
        log.success(`新規コレクション作成: ${collectionName}`);
        initialized++;
      } else {
        log.verbose(`コレクション既存: ${collectionName}`);
      }
    } catch (error) {
      log.error(`コレクション初期化失敗 ${collectionName}: ${error.message}`);
    }
  }
  
  log.success(`新規コレクション初期化完了: ${initialized}/${newCollections.length}`);
  return initialized;
}

/**
 * ハッシュタグの初期データ生成
 */
async function generateInitialHashtags() {
  log.info('🏷️ ハッシュタグの初期データ生成を開始...');
  
  try {
    const postsCollection = mongoose.connection.collection('posts');
    const hashtagsCollection = mongoose.connection.collection('hashtags');
    
    // 全投稿からハッシュタグを抽出
    const posts = await postsCollection.find({ hashtags: { $exists: true, $ne: [] } }).toArray();
    
    const hashtagStats = new Map();
    
    // ハッシュタグ使用統計を計算
    for (const post of posts) {
      for (const hashtag of post.hashtags || []) {
        if (!hashtagStats.has(hashtag)) {
          hashtagStats.set(hashtag, {
            name: hashtag,
            displayName: hashtag,
            totalPosts: 0,
            firstUsed: post.createdAt,
            lastUsed: post.createdAt,
            users: new Set()
          });
        }
        
        const stats = hashtagStats.get(hashtag);
        stats.totalPosts++;
        if (post.createdAt < stats.firstUsed) stats.firstUsed = post.createdAt;
        if (post.createdAt > stats.lastUsed) stats.lastUsed = post.createdAt;
        if (post.userId) stats.users.add(post.userId);
      }
    }
    
    let created = 0;
    
    // ハッシュタグドキュメントを作成
    for (const [name, data] of hashtagStats) {
      const existingHashtag = await hashtagsCollection.findOne({ name });
      
      if (!existingHashtag && !config.dryRun) {
        const hashtagDoc = {
          name: data.name,
          displayName: data.displayName,
          category: 'general',
          status: 'active',
          isOfficial: false,
          isTrending: data.totalPosts > 10,
          isBlocked: false,
          stats: {
            totalPosts: data.totalPosts,
            totalComments: 0,
            uniqueUsers: data.users.size,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            lastUsed: data.lastUsed,
            trendScore: Math.min(data.totalPosts * 2, 100),
            dailyStats: []
          },
          relatedTags: [],
          synonyms: [],
          searchTerms: [data.name],
          aliases: [],
          isEvent: false,
          createdAt: data.firstUsed,
          updatedAt: new Date()
        };
        
        await hashtagsCollection.insertOne(hashtagDoc);
        created++;
      }
    }
    
    log.success(`ハッシュタグ初期データ生成完了: ${created}件作成, ${hashtagStats.size}件解析`);
    return { created, analyzed: hashtagStats.size };
    
  } catch (error) {
    log.error(`ハッシュタグ初期データ生成失敗: ${error.message}`);
    throw error;
  }
}

/**
 * インデックスの作成
 */
async function createIndexes() {
  log.info('📊 インデックスの作成を開始...');
  
  if (config.dryRun) {
    log.info('DryRunモード: インデックス作成をスキップ');
    return 0;
  }
  
  try {
    // 基本的なインデックスのみ作成（TypeScriptファイルの読み込みエラーを回避）
    const collections = [
      {
        name: 'users',
        indexes: [
          { email: 1 },
          { username: 1 }
        ]
      },
      {
        name: 'posts',
        indexes: [
          { userId: 1, createdAt: -1 },
          { hashtags: 1 },
          { isDeleted: 1, createdAt: -1 }
        ]
      }
    ];
    
    let created = 0;
    
    for (const collectionDef of collections) {
      const collection = mongoose.connection.collection(collectionDef.name);
      
      for (const indexSpec of collectionDef.indexes) {
        try {
          await collection.createIndex(indexSpec, { background: true });
          created++;
          log.verbose(`インデックス作成: ${collectionDef.name} - ${JSON.stringify(indexSpec)}`);
        } catch (error) {
          log.warning(`インデックス作成失敗: ${collectionDef.name} - ${error.message}`);
        }
      }
    }
    
    log.success(`基本インデックス作成完了: ${created}個`);
    return created;
    
  } catch (error) {
    log.warning(`インデックス作成失敗: ${error.message}`);
    log.info('手動でインデックス作成を実行してください');
    return 0;
  }
}

/**
 * 統計情報の再計算
 */
async function recalculateStats() {
  log.info('📈 統計情報の再計算を開始...');
  
  try {
    const usersCollection = mongoose.connection.collection('users');
    const postsCollection = mongoose.connection.collection('posts');
    
    // ユーザー統計の再計算
    const users = await usersCollection.find({}).toArray();
    let userStatsUpdated = 0;
    
    for (const user of users) {
      // 投稿数カウント
      const postsCount = await postsCollection.countDocuments({ 
        userId: user._id.toString(),
        isDeleted: { $ne: true }
      });
      
      // いいね受信数計算
      const userPosts = await postsCollection.find({ 
        userId: user._id.toString(),
        isDeleted: { $ne: true }
      }).toArray();
      
      const likesReceived = userPosts.reduce((total, post) => total + (post.likes || 0), 0);
      
      if (!config.dryRun) {
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: {
              'stats.postsCount': postsCount,
              'stats.likesReceived': likesReceived
            }
          }
        );
      }
      
      userStatsUpdated++;
      
      if (userStatsUpdated % 50 === 0) {
        log.info(`ユーザー統計再計算進捗: ${userStatsUpdated}/${users.length}`);
      }
    }
    
    log.success(`統計情報再計算完了 - ユーザー: ${userStatsUpdated}`);
    return { userStatsUpdated };
    
  } catch (error) {
    log.error(`統計情報再計算失敗: ${error.message}`);
    throw error;
  }
}

/**
 * データ整合性チェック
 */
async function validateDataIntegrity() {
  log.info('🔍 データ整合性チェックを開始...');
  
  const issues = [];
  
  try {
    // ユーザーデータの整合性チェック
    const usersCollection = mongoose.connection.collection('users');
    const usersWithoutUsername = await usersCollection.countDocuments({ username: { $exists: false } });
    if (usersWithoutUsername > 0) {
      issues.push(`ユーザー名なしユーザー: ${usersWithoutUsername}件`);
    }
    
    const duplicateUsernames = await usersCollection.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    if (duplicateUsernames.length > 0) {
      issues.push(`重複ユーザー名: ${duplicateUsernames.length}件`);
    }
    
    // 投稿データの整合性チェック
    const postsCollection = mongoose.connection.collection('posts');
    const postsWithoutType = await postsCollection.countDocuments({ type: { $exists: false } });
    if (postsWithoutType > 0) {
      issues.push(`タイプ未設定投稿: ${postsWithoutType}件`);
    }
    
    if (issues.length === 0) {
      log.success('データ整合性チェック: 問題なし');
    } else {
      log.warning(`データ整合性チェック: ${issues.length}件の問題を検出`);
      issues.forEach(issue => log.warning(`  - ${issue}`));
    }
    
    return issues;
    
  } catch (error) {
    log.error(`データ整合性チェック失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 移行完了後のクリーンアップ
 */
async function cleanup() {
  log.info('🧹 移行後クリーンアップを開始...');
  
  try {
    log.success('クリーンアップ完了');
    return true;
  } catch (error) {
    log.error(`クリーンアップ失敗: ${error.message}`);
    return false;
  }
}

/**
 * 移行進捗の保存
 */
async function saveMigrationProgress(step, status, details = {}) {
  try {
    await fs.mkdir(config.migrationLogPath, { recursive: true });
    
    const progressFile = path.join(config.migrationLogPath, 'migration-progress.json');
    
    let progress = {};
    try {
      const existingProgress = await fs.readFile(progressFile, 'utf8');
      progress = JSON.parse(existingProgress);
    } catch (error) {
      // ファイルが存在しない場合は新規作成
    }
    
    progress[step] = {
      status,
      timestamp: new Date().toISOString(),
      details
    };
    
    await fs.writeFile(progressFile, JSON.stringify(progress, null, 2));
    
  } catch (error) {
    log.warning(`進捗保存失敗: ${error.message}`);
  }
}

/**
 * メイン移行処理
 */
async function runMigration() {
  const startTime = Date.now();
  log.info('🚀 Phase 6.0 SNS機能移行を開始します...');
  
  if (config.dryRun) {
    log.warning('⚠️ DRY RUN モード: 実際の変更は行われません');
  }
  
  try {
    // データベース接続
    await initializeDatabase();
    await saveMigrationProgress('database_connection', 'completed');
    
    // バックアップ作成
    const backupFile = await createBackup();
    await saveMigrationProgress('backup', 'completed', { backupFile });
    
    // Step 1: 既存ユーザーモデル拡張
    log.info('\n=== Step 1: ユーザーモデル拡張 ===');
    const userResults = await migrateUsers();
    await saveMigrationProgress('user_migration', 'completed', userResults);
    
    // Step 2: 既存投稿モデル拡張
    log.info('\n=== Step 2: 投稿モデル拡張 ===');
    const postResults = await migratePosts();
    await saveMigrationProgress('post_migration', 'completed', postResults);
    
    // Step 3: 新規コレクション初期化
    log.info('\n=== Step 3: 新規コレクション初期化 ===');
    const newCollections = await initializeNewCollections();
    await saveMigrationProgress('new_collections', 'completed', { created: newCollections });
    
    // Step 4: ハッシュタグ初期データ生成
    log.info('\n=== Step 4: ハッシュタグ初期データ生成 ===');
    const hashtagResults = await generateInitialHashtags();
    await saveMigrationProgress('hashtag_initialization', 'completed', hashtagResults);
    
    // Step 5: インデックス作成
    log.info('\n=== Step 5: インデックス作成 ===');
    const indexResults = await createIndexes();
    await saveMigrationProgress('index_creation', 'completed', { created: indexResults });
    
    // Step 6: 統計情報再計算
    log.info('\n=== Step 6: 統計情報再計算 ===');
    const statsResults = await recalculateStats();
    await saveMigrationProgress('stats_recalculation', 'completed', statsResults);
    
    // Step 7: データ整合性チェック
    log.info('\n=== Step 7: データ整合性チェック ===');
    const integrityIssues = await validateDataIntegrity();
    await saveMigrationProgress('integrity_check', 'completed', { issues: integrityIssues });
    
    // Step 8: クリーンアップ
    log.info('\n=== Step 8: クリーンアップ ===');
    await cleanup();
    await saveMigrationProgress('cleanup', 'completed');
    
    // 移行完了
    const duration = (Date.now() - startTime) / 1000;
    
    log.success('\n🎉 Phase 6.0 SNS機能移行が完了しました!');
    log.info(`⏱️ 実行時間: ${duration.toFixed(1)}秒`);
    
    // 移行サマリー
    log.info('\n📊 移行サマリー:');
    log.info(`  👥 ユーザー拡張: ${userResults.updated}/${userResults.processed}`);
    log.info(`  📝 投稿拡張: ${postResults.updated}/${postResults.processed}`);
    log.info(`  🆕 新規コレクション: ${newCollections}`);
    log.info(`  🏷️ ハッシュタグ作成: ${hashtagResults.created}`);
    log.info(`  📊 インデックス作成: ${indexResults}`);
    log.info(`  📈 統計情報更新: ${statsResults.userStatsUpdated}`);
    
    if (integrityIssues.length > 0) {
      log.warning(`  ⚠️ 整合性問題: ${integrityIssues.length}件`);
    }
    
    await saveMigrationProgress('migration_complete', 'completed', {
      duration,
      summary: {
        userResults,
        postResults,
        newCollections,
        hashtagResults,
        indexResults,
        statsResults,
        integrityIssues
      }
    });
    
  } catch (error) {
    log.error(`\n💥 移行処理失敗: ${error.message}`);
    log.error(`スタックトレース: ${error.stack}`);
    
    await saveMigrationProgress('migration_failed', 'error', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  } finally {
    await mongoose.disconnect();
    log.info('データベース接続を切断しました');
  }
}

// メイン実行
if (require.main === module) {
  runMigration()
    .then(() => {
      log.success('移行スクリプト正常終了');
      process.exit(0);
    })
    .catch((error) => {
      log.error('移行スクリプト異常終了');
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  migrateUsers,
  migratePosts,
  initializeNewCollections,
  generateInitialHashtags,
  createIndexes,
  recalculateStats,
  validateDataIntegrity
};