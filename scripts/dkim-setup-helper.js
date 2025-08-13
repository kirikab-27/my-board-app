const readline = require('readline');

/**
 * DKIM設定支援ツール
 * さくらインターネットで生成されたDKIM情報をCloudflareに設定するためのヘルパー
 */

console.log('🔐 DKIM設定支援ツール');
console.log('='.repeat(60));
console.log('');
console.log('このツールは、さくらインターネットで生成されたDKIM情報を');
console.log('Cloudflareに設定するためのレコード情報を生成します。');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupDKIM() {
  try {
    console.log('📋 STEP 1: さくらインターネットのDKIM情報を入力');
    console.log('-'.repeat(50));
    
    // セレクタの入力
    const selector = await askQuestion('🏷️  DKIM セレクタを入力してください (例: rs20240118): ');
    if (!selector) {
      console.log('❌ セレクタが入力されませんでした。');
      rl.close();
      return;
    }

    // 公開鍵の入力
    console.log('');
    console.log('📝 公開鍵を入力してください。');
    console.log('   コントロールパネルの「DKIMレコード」から');
    console.log('   p= 以降の文字列をコピー&ペーストしてください：');
    console.log('');
    
    const publicKey = await askQuestion('🗝️  公開鍵 (p=以降の文字列): ');
    if (!publicKey) {
      console.log('❌ 公開鍵が入力されませんでした。');
      rl.close();
      return;
    }

    // ドメイン確認
    const domain = 'kab137lab.com';
    console.log('');
    console.log(`🌐 設定対象ドメイン: ${domain}`);

    // DNS レコード生成
    console.log('');
    console.log('🎯 STEP 2: Cloudflare DNS設定情報');
    console.log('='.repeat(60));
    console.log('');

    // DKIM レコード
    console.log('📌 【1】 DKIM レコード設定');
    console.log('-'.repeat(30));
    console.log(`タイプ: TXT`);
    console.log(`名前: ${selector}._domainkey`);
    
    // 公開鍵の長さチェック
    const fullDkimRecord = `v=DKIM1; k=rsa; p=${publicKey}`;
    
    if (fullDkimRecord.length > 400) {
      // 長い場合は分割
      const firstPart = `v=DKIM1; k=rsa; p=${publicKey.substring(0, 200)}`;
      const secondPart = publicKey.substring(200);
      
      console.log('内容（分割版）:');
      console.log(`  "${firstPart}"`);
      console.log(`  "${secondPart}"`);
      console.log('');
      console.log('⚠️  長い公開鍵のため2行に分割してください');
    } else {
      console.log(`内容: ${fullDkimRecord}`);
    }
    
    console.log('');

    // DMARC レコード
    console.log('📌 【2】 DMARC レコード設定');
    console.log('-'.repeat(30));
    console.log('タイプ: TXT');
    console.log('名前: _dmarc');
    console.log('内容: v=DMARC1; p=none; rua=mailto:noreply@kab137lab.com');
    console.log('');

    // SPF レコード更新
    console.log('📌 【3】 SPF レコード確認・更新');
    console.log('-'.repeat(30));
    console.log('タイプ: TXT');
    console.log('名前: @');
    console.log('内容: v=spf1 a:kab137lab.sakura.ne.jp mx ~all');
    console.log('');

    // 検証方法
    console.log('🔍 STEP 3: 設定後の検証方法');
    console.log('='.repeat(60));
    console.log('');
    console.log('1. DNS反映確認（24-48時間後）:');
    console.log(`   nslookup -type=txt ${selector}._domainkey.${domain}`);
    console.log(`   nslookup -type=txt _dmarc.${domain}`);
    console.log('');
    console.log('2. DKIM署名テスト:');
    console.log('   node scripts/test-dkim-email.js');
    console.log('');
    console.log('3. オンライン検証ツール:');
    console.log('   • MXToolbox DKIM Lookup');
    console.log('   • DMARC Analyzer');
    console.log('   • Mail Tester (https://www.mail-tester.com)');
    console.log('');

    // 重要な注意事項
    console.log('⚠️  重要な注意事項');
    console.log('='.repeat(60));
    console.log('');
    console.log('1. 設定順序:');
    console.log('   • まず さくら側でDKIM有効化');
    console.log('   • その後 Cloudflareで上記DNS設定');
    console.log('');
    console.log('2. テストモード:');
    console.log('   • 初期設定では "t=y" でテスト');
    console.log('   • 動作確認後にテストフラグを削除');
    console.log('');
    console.log('3. 段階的運用:');
    console.log('   • DMARC: none → quarantine → reject');
    console.log('   • 問題がないことを確認してから厳格化');

    console.log('');
    console.log('✅ DKIM設定情報の生成が完了しました！');
    console.log('   上記の情報をもとにCloudflareで設定を行ってください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  } finally {
    rl.close();
  }
}

// 実行
setupDKIM();