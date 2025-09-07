#!/usr/bin/env node

/**
 * デプロイ前チェックリスト自動化スクリプト
 * 
 * 使用方法:
 * npm run pre-deploy
 * または
 * node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 色付きコンソール出力
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}`)
};

// チェック結果の集計
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. 環境変数チェック
function checkEnvironmentVariables() {
  log.header('1. 環境変数チェック');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'APP_URL'
  ];
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), '.env');
  
  // .env.exampleの存在確認
  if (fs.existsSync(envExamplePath)) {
    log.success('.env.example ファイルが存在します');
    results.passed.push('.env.example exists');
  } else {
    log.warning('.env.example ファイルが見つかりません');
    results.warnings.push('.env.example not found');
  }
  
  // .envファイルの存在確認
  if (!fs.existsSync(envPath)) {
    log.error('.env ファイルが見つかりません');
    results.failed.push('.env file not found');
    return;
  }
  
  // 必須環境変数の確認
  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=`, 'm');
    if (!regex.test(envContent)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log.error(`必須環境変数が不足: ${missingVars.join(', ')}`);
    results.failed.push(`Missing env vars: ${missingVars.join(', ')}`);
  } else {
    log.success('すべての必須環境変数が設定されています');
    results.passed.push('All required env vars set');
  }
}

// 2. 依存関係チェック
function checkDependencies() {
  log.header('2. 依存関係チェック');
  
  try {
    // package-lock.jsonの同期確認
    execSync('npm ls --depth=0', { stdio: 'ignore' });
    log.success('依存関係が正しくインストールされています');
    results.passed.push('Dependencies installed correctly');
  } catch (error) {
    log.warning('依存関係に問題がある可能性があります');
    log.info('npm install を実行してください');
    results.warnings.push('Dependency issues detected');
  }
  
  // セキュリティ監査
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
      log.warning(`セキュリティ脆弱性: High: ${audit.metadata.vulnerabilities.high}, Critical: ${audit.metadata.vulnerabilities.critical}`);
      results.warnings.push('Security vulnerabilities found');
    } else {
      log.success('高リスクのセキュリティ脆弱性はありません');
      results.passed.push('No high-risk vulnerabilities');
    }
  } catch (error) {
    log.info('npm audit をスキップしました');
  }
}

// 3. TypeScriptチェック
function checkTypeScript() {
  log.header('3. TypeScript型チェック');
  
  try {
    execSync('npm run type-check', { stdio: 'ignore' });
    log.success('TypeScript型チェック合格');
    results.passed.push('TypeScript check passed');
  } catch (error) {
    log.error('TypeScript型エラーがあります');
    results.failed.push('TypeScript errors found');
  }
}

// 4. ESLintチェック
function checkESLint() {
  log.header('4. ESLintチェック');
  
  try {
    execSync('npm run lint', { stdio: 'ignore' });
    log.success('ESLintチェック合格');
    results.passed.push('ESLint check passed');
  } catch (error) {
    log.error('ESLintエラーがあります');
    results.failed.push('ESLint errors found');
  }
}

// 5. ビルドテスト
function checkBuild() {
  log.header('5. ビルドテスト');
  
  log.info('ビルドを実行中... (これには時間がかかる場合があります)');
  
  try {
    execSync('npm run build', { stdio: 'ignore' });
    
    // .nextディレクトリの確認
    if (fs.existsSync(path.join(process.cwd(), '.next'))) {
      log.success('ビルド成功');
      results.passed.push('Build successful');
    } else {
      log.error('ビルド出力が見つかりません');
      results.failed.push('Build output not found');
    }
  } catch (error) {
    log.error('ビルドエラーが発生しました');
    results.failed.push('Build failed');
  }
}

// 6. 設定ファイルチェック
function checkConfigFiles() {
  log.header('6. 設定ファイルチェック');
  
  const configFiles = [
    { name: 'vercel.json', required: true },
    { name: 'next.config.js', required: true },
    { name: 'tsconfig.json', required: true },
    { name: '.gitignore', required: true },
    { name: 'README.md', required: false }
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file.name);
    if (fs.existsSync(filePath)) {
      log.success(`${file.name} が存在します`);
      results.passed.push(`${file.name} exists`);
    } else if (file.required) {
      log.error(`${file.name} が見つかりません`);
      results.failed.push(`${file.name} not found`);
    } else {
      log.warning(`${file.name} が見つかりません（オプション）`);
      results.warnings.push(`${file.name} not found (optional)`);
    }
  });
}

// 7. Gitステータスチェック
function checkGitStatus() {
  log.header('7. Gitステータスチェック');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      log.warning('コミットされていない変更があります:');
      console.log(status);
      results.warnings.push('Uncommitted changes');
    } else {
      log.success('すべての変更がコミットされています');
      results.passed.push('All changes committed');
    }
    
    // 現在のブランチ確認
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log.info(`現在のブランチ: ${branch}`);
    
    if (branch === 'main') {
      log.success('mainブランチからデプロイ準備中');
    } else {
      log.warning(`${branch} ブランチからのデプロイです`);
    }
  } catch (error) {
    log.warning('Gitステータスを確認できませんでした');
  }
}

// 結果サマリー表示
function showSummary() {
  log.header('デプロイ前チェック結果サマリー');
  
  console.log('\n📊 チェック結果:');
  console.log(`  ✅ 合格: ${results.passed.length} 項目`);
  console.log(`  ⚠️  警告: ${results.warnings.length} 項目`);
  console.log(`  ❌ 失敗: ${results.failed.length} 項目`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ 失敗項目:');
    results.failed.forEach(item => {
      console.log(`  - ${item}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  警告項目:');
    results.warnings.forEach(item => {
      console.log(`  - ${item}`);
    });
  }
  
  console.log('\n');
  
  if (results.failed.length === 0) {
    log.success('🚀 デプロイ準備完了！');
    console.log('\n次のコマンドでデプロイを実行できます:');
    console.log('  git push origin main');
    console.log('  または');
    console.log('  vercel --prod');
    process.exit(0);
  } else {
    log.error('🛑 デプロイ前に修正が必要な項目があります');
    process.exit(1);
  }
}

// メイン実行
async function main() {
  console.log('\n');
  log.header('🚀 デプロイ前チェックリスト実行中...');
  
  checkEnvironmentVariables();
  checkDependencies();
  checkTypeScript();
  checkESLint();
  checkBuild();
  checkConfigFiles();
  checkGitStatus();
  
  showSummary();
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  log.error('予期しないエラーが発生しました:');
  console.error(error);
  process.exit(1);
});

// 実行
main().catch(error => {
  log.error('チェック中にエラーが発生しました:');
  console.error(error);
  process.exit(1);
});