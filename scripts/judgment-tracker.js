#!/usr/bin/env node

// 判定記録システム - 緊急性罠回避の効果測定
const fs = require('fs');
const path = require('path');

const RECORD_FILE = path.join(__dirname, '..', 'docs', 'emergency-judgments.json');

// 判定記録の作成・追加
function recordJudgment(data) {
  const record = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ja-JP'),
    problem: data.problem,
    initialJudgment: data.initialJudgment, // CRITICAL|HIGH|MEDIUM|LOW
    usedEmergencyBrake: data.usedEmergencyBrake, // true/false
    timeToSolve: data.timeToSolve, // minutes
    wasSuccessful: data.wasSuccessful, // true/false
    actualComplexity: data.actualComplexity, // 事後評価
    wasCorrectJudgment: data.wasCorrectJudgment, // true/false
    lessonsLearned: data.lessonsLearned || '',
    relatedIssue: data.relatedIssue || null
  };

  // 既存記録の読み込み
  let records = [];
  if (fs.existsSync(RECORD_FILE)) {
    try {
      const content = fs.readFileSync(RECORD_FILE, 'utf8');
      records = JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 既存記録読み込みエラー:', error.message);
      records = [];
    }
  }

  // 新記録の追加
  records.push(record);

  // ディレクトリ作成（必要に応じて）
  const dir = path.dirname(RECORD_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // ファイル保存
  fs.writeFileSync(RECORD_FILE, JSON.stringify(records, null, 2), 'utf8');
  
  console.log('✅ 判定記録保存完了:', {
    problem: record.problem,
    judgment: record.initialJudgment,
    usedBrake: record.usedEmergencyBrake
  });
}

// 統計表示
function showStats() {
  if (!fs.existsSync(RECORD_FILE)) {
    console.log('📊 記録なし: まだ判定記録がありません');
    return;
  }

  try {
    const content = fs.readFileSync(RECORD_FILE, 'utf8');
    const records = JSON.parse(content);

    console.log('\n📊 緊急性判定統計:');
    console.log(`  - 総記録数: ${records.length}`);
    
    const brakeUsage = records.filter(r => r.usedEmergencyBrake).length;
    console.log(`  - 5分ルール実行: ${brakeUsage}/${records.length} (${((brakeUsage/records.length)*100).toFixed(1)}%)`);
    
    const correctJudgments = records.filter(r => r.wasCorrectJudgment).length;
    console.log(`  - 正確な判定: ${correctJudgments}/${records.length} (${((correctJudgments/records.length)*100).toFixed(1)}%)`);
    
    const successful = records.filter(r => r.wasSuccessful).length;
    console.log(`  - 解決成功: ${successful}/${records.length} (${((successful/records.length)*100).toFixed(1)}%)`);

    console.log('\n📋 緊急度別分布:');
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
      const count = records.filter(r => r.initialJudgment === level).length;
      console.log(`  - ${level}: ${count}回`);
    });

    if (records.length > 0) {
      const avgTime = records.reduce((sum, r) => sum + (r.timeToSolve || 0), 0) / records.length;
      console.log(`\n⏱️ 平均解決時間: ${avgTime.toFixed(1)}分`);
    }

  } catch (error) {
    console.error('❌ 統計表示エラー:', error.message);
  }
}

// コマンドライン実行時の処理
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'record') {
    // インタラクティブな記録入力
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('📝 判定記録を作成します...\n');
    
    const data = {};
    
    const questions = [
      { key: 'problem', text: '問題を1行で説明: ' },
      { key: 'initialJudgment', text: '初期判定 (CRITICAL/HIGH/MEDIUM/LOW): ' },
      { key: 'usedEmergencyBrake', text: '5分ルール実行しましたか？ (y/n): ' },
      { key: 'timeToSolve', text: '解決にかかった時間（分）: ' },
      { key: 'wasSuccessful', text: '問題は解決しましたか？ (y/n): ' },
      { key: 'actualComplexity', text: '実際の複雑度 (CRITICAL/HIGH/MEDIUM/LOW): ' },
      { key: 'lessonsLearned', text: '学んだ教訓: ' },
      { key: 'relatedIssue', text: '関連Issue番号（任意）: ' }
    ];

    let currentQuestion = 0;

    function askQuestion() {
      if (currentQuestion >= questions.length) {
        // 記録保存
        data.usedEmergencyBrake = data.usedEmergencyBrake?.toLowerCase() === 'y';
        data.wasSuccessful = data.wasSuccessful?.toLowerCase() === 'y';
        data.timeToSolve = parseInt(data.timeToSolve) || 0;
        data.wasCorrectJudgment = data.initialJudgment === data.actualComplexity;
        
        recordJudgment(data);
        rl.close();
        return;
      }

      const question = questions[currentQuestion];
      rl.question(question.text, (answer) => {
        data[question.key] = answer.trim();
        currentQuestion++;
        askQuestion();
      });
    }

    askQuestion();

  } else if (command === 'stats') {
    showStats();
  } else {
    console.log('使用方法:');
    console.log('  node scripts/judgment-tracker.js record  # 新しい判定記録');
    console.log('  node scripts/judgment-tracker.js stats   # 統計表示');
  }
}

module.exports = { recordJudgment, showStats };