// 簡易レート制限テストスクリプト
const { 
  checkIPRateLimit, 
  checkUserRateLimit, 
  recordFailedAttempt, 
  resetAttempts,
  getRateLimitInfo
} = require('../src/lib/security/rateLimit');

console.log('🔒 レート制限システム動作テスト\n');

// テスト用データ
const testIP = '192.168.1.100';
const testEmail = 'test@example.com';

console.log('=== 初期状態確認 ===');
let info = getRateLimitInfo(testIP, testEmail);
console.log('IP制限状況:', info.ip);
console.log('ユーザー制限状況:', info.user);
console.log('');

console.log('=== ユーザー制限テスト（5回まで許可） ===');

for (let i = 1; i <= 7; i++) {
  console.log(`--- 試行 ${i} ---`);
  
  // 制限チェック
  const userLimit = checkUserRateLimit(testEmail);
  const ipLimit = checkIPRateLimit(testIP);
  
  console.log(`ユーザー制限: ${userLimit.success ? '✅ 許可' : '❌ ブロック'}`);
  console.log(`IP制限: ${ipLimit.success ? '✅ 許可' : '❌ ブロック'}`);
  
  if (!userLimit.success) {
    console.log(`🚫 ユーザーブロック: ${userLimit.error}`);
    console.log(`ロック解除時刻: ${new Date(userLimit.lockUntil)}`);
  }
  
  if (!ipLimit.success) {
    console.log(`🚫 IPブロック: ${ipLimit.error}`);
    console.log(`ロック解除時刻: ${new Date(ipLimit.lockUntil)}`);
  }
  
  // 制限内の場合は失敗を記録
  if (userLimit.success && ipLimit.success) {
    recordFailedAttempt(testIP, testEmail);
    console.log(`📝 失敗記録: ${testEmail} from ${testIP}`);
  }
  
  // 現在の状況表示
  info = getRateLimitInfo(testIP, testEmail);
  console.log(`残り試行回数 - ユーザー: ${info.user?.remaining || 0}, IP: ${info.ip.remaining}`);
  console.log('');
  
  // ブロックされたら停止
  if (!userLimit.success || !ipLimit.success) {
    console.log('🛑 制限発動により停止\n');
    break;
  }
}

console.log('=== 最終状態確認 ===');
const finalInfo = getRateLimitInfo(testIP, testEmail);
console.log('IP情報:', finalInfo.ip);
console.log('ユーザー情報:', finalInfo.user);
console.log('');

console.log('=== 制限リセットテスト ===');
resetAttempts(testIP, testEmail);
console.log('✅ 制限をリセット');

const resetInfo = getRateLimitInfo(testIP, testEmail);
console.log('リセット後のIP情報:', resetInfo.ip);
console.log('リセット後のユーザー情報:', resetInfo.user);
console.log('');

console.log('=== IP制限テスト（10回まで許可） ===');
const testEmail2 = 'another@example.com';

for (let i = 1; i <= 12; i++) {
  const ipLimit = checkIPRateLimit(testIP);
  
  console.log(`IP試行 ${i}: ${ipLimit.success ? '✅ 許可' : '❌ ブロック'} (残り: ${ipLimit.remainingAttempts})`);
  
  if (!ipLimit.success) {
    console.log(`🚫 IPブロック発動: ${ipLimit.error}`);
    break;
  }
  
  // 異なるユーザーでの失敗を記録（IP制限をテスト）
  recordFailedAttempt(testIP, testEmail2);
}

console.log('\n✅ テスト完了');
console.log('📋 確認項目:');
console.log('1. ユーザー制限: 5回で発動');
console.log('2. IP制限: 10回で発動');
console.log('3. 段階的ロック: 1分間ブロック');
console.log('4. リセット機能: 正常動作');
console.log('\n💡 実際のログイン画面でテストしてください:');
console.log('   http://localhost:3010/login');