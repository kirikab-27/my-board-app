// scripts/check-doc-health.js
const fs = require('fs');
const path = require('path');

// 設定値
const CONFIG = {
  CLAUDE_MD_MAX_LINES: 1500,
  SECTION_MAX_LINES: 200,
  WARNING_THRESHOLD: 0.8, // 80%で警告
  CLAUDE_MD_PATH: './CLAUDE.md',
  DOCS_DIR: './docs',
  COLOR: {
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    GREEN: '\x1b[32m',
    BLUE: '\x1b[34m',
    RESET: '\x1b[0m'
  }
};

// ファイルの行数をカウント
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

// セクションごとの行数をカウント
function analyzeSections(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const sections = [];
    let currentSection = { name: 'Header', startLine: 0, lines: 0 };
    
    lines.forEach((line, index) => {
      if (line.match(/^##\s+/)) {
        if (currentSection.lines > 0) {
          currentSection.lines = index - currentSection.startLine;
          sections.push(currentSection);
        }
        currentSection = {
          name: line.replace(/^##\s+/, '').trim(),
          startLine: index,
          lines: 0
        };
      }
    });
    
    // 最後のセクション
    if (currentSection.lines === 0) {
      currentSection.lines = lines.length - currentSection.startLine;
      sections.push(currentSection);
    }
    
    return sections;
  } catch (error) {
    return [];
  }
}

// ステータスアイコンを取得
function getStatusIcon(ratio) {
  if (ratio >= 1) return '❌';
  if (ratio >= CONFIG.WARNING_THRESHOLD) return '⚠️';
  return '✅';
}

// プログレスバーを生成
function createProgressBar(ratio, width = 30) {
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (ratio >= 1) return CONFIG.COLOR.RED + bar + CONFIG.COLOR.RESET;
  if (ratio >= CONFIG.WARNING_THRESHOLD) return CONFIG.COLOR.YELLOW + bar + CONFIG.COLOR.RESET;
  return CONFIG.COLOR.GREEN + bar + CONFIG.COLOR.RESET;
}

// メインのヘルスチェック
function checkDocumentHealth() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ドキュメント健全性チェック');
  console.log('='.repeat(60));
  
  // CLAUDE.md全体のチェック
  const claudeMdLines = countLines(CONFIG.CLAUDE_MD_PATH);
  const claudeMdRatio = claudeMdLines / CONFIG.CLAUDE_MD_MAX_LINES;
  
  console.log('\n📄 CLAUDE.md 全体');
  console.log('─'.repeat(50));
  console.log(`行数: ${claudeMdLines} / ${CONFIG.CLAUDE_MD_MAX_LINES}`);
  console.log(`使用率: ${(claudeMdRatio * 100).toFixed(1)}%`);
  console.log(`状態: ${getStatusIcon(claudeMdRatio)} ${createProgressBar(claudeMdRatio)}`);
  
  if (claudeMdRatio >= CONFIG.WARNING_THRESHOLD) {
    console.log(CONFIG.COLOR.YELLOW + '⚠️  警告: CLAUDE.mdが肥大化しています！' + CONFIG.COLOR.RESET);
  }
  
  // セクションごとのチェック
  console.log('\n📑 セクション別分析');
  console.log('─'.repeat(50));
  
  const sections = analyzeSections(CONFIG.CLAUDE_MD_PATH);
  const problematicSections = [];
  
  sections.forEach(section => {
    const ratio = section.lines / CONFIG.SECTION_MAX_LINES;
    const status = getStatusIcon(ratio);
    
    if (ratio >= CONFIG.WARNING_THRESHOLD) {
      problematicSections.push(section);
      console.log(`${status} ${section.name}: ${section.lines}行 ${createProgressBar(ratio, 20)}`);
    }
  });
  
  // 推奨アクション
  if (problematicSections.length > 0) {
    console.log('\n💡 推奨アクション');
    console.log('─'.repeat(50));
    
    problematicSections.forEach(section => {
      const ratio = section.lines / CONFIG.SECTION_MAX_LINES;
      if (ratio >= 1) {
        console.log(`❌ "${section.name}" を別ファイルに分離してください`);
        console.log(`   → docs/${section.name.toLowerCase().replace(/\s+/g, '-')}.md`);
      } else {
        console.log(`⚠️  "${section.name}" の分離を検討してください`);
      }
    });
  }
  
  // ドキュメント構造の確認
  console.log('\n📁 ドキュメント構造');
  console.log('─'.repeat(50));
  
  const docFiles = [];
  const readmeFiles = [];
  
  // docsフォルダのチェック
  if (fs.existsSync(CONFIG.DOCS_DIR)) {
    const walkDir = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          console.log(`${prefix}📁 ${file}/`);
          walkDir(filePath, prefix + '  ');
        } else if (file.endsWith('.md')) {
          const lines = countLines(filePath);
          console.log(`${prefix}📄 ${file} (${lines}行)`);
          docFiles.push({ path: filePath, lines });
        }
      });
    };
    walkDir(CONFIG.DOCS_DIR);
  }
  
  // README-*.mdファイルのチェック
  const rootFiles = fs.readdirSync('.');
  rootFiles.forEach(file => {
    if (file.startsWith('README-') && file.endsWith('.md')) {
      const lines = countLines(`./${file}`);
      readmeFiles.push({ name: file, lines });
    }
  });
  
  if (readmeFiles.length > 0) {
    console.log('\n📋 README系ファイル');
    console.log('─'.repeat(50));
    readmeFiles.forEach(file => {
      console.log(`📄 ${file.name} (${file.lines}行)`);
    });
  }
  
  // サマリー
  console.log('\n📊 サマリー');
  console.log('─'.repeat(50));
  console.log(`CLAUDE.md健全性: ${getHealthStatus(claudeMdRatio)}`);
  console.log(`問題のあるセクション: ${problematicSections.length}個`);
  console.log(`関連ドキュメント: ${docFiles.length + readmeFiles.length}ファイル`);
  
  // 総合評価
  const overallHealth = getOverallHealth(claudeMdRatio, problematicSections.length);
  console.log(`\n総合評価: ${overallHealth}`);
  console.log('='.repeat(60) + '\n');
  
  return {
    claudeMdLines,
    claudeMdRatio,
    problematicSections,
    docFiles,
    readmeFiles
  };
}

// 健全性ステータス
function getHealthStatus(ratio) {
  if (ratio >= 1) return '❌ 要対策';
  if (ratio >= CONFIG.WARNING_THRESHOLD) return '⚠️ 注意';
  return '✅ 良好';
}

// 総合評価
function getOverallHealth(claudeMdRatio, problematicCount) {
  if (claudeMdRatio >= 1 || problematicCount >= 3) {
    return '❌ 早急な対策が必要です';
  }
  if (claudeMdRatio >= CONFIG.WARNING_THRESHOLD || problematicCount >= 1) {
    return '⚠️ 改善を検討してください';
  }
  return '✅ 健全な状態です';
}

// 実行
if (require.main === module) {
  checkDocumentHealth();
}

module.exports = { checkDocumentHealth, countLines, analyzeSections };