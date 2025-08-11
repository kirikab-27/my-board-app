const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * SPFレコードの検証ツール
 * Usage: node scripts/verify-spf.js [domain]
 */

const domain = process.argv[2] || 'kab137lab.com';

async function verifySPF() {
  console.log(`🔍 ${domain} のSPFレコードを検証中...`);
  console.log('='.repeat(50));

  try {
    // SPFレコード取得
    const { stdout } = await execPromise(`nslookup -type=txt ${domain}`);
    
    const txtRecords = stdout
      .split('\n')
      .filter(line => line.includes('text ='))
      .map(line => line.replace(/.*text = "(.+)"/, '$1'));

    const spfRecord = txtRecords.find(record => record.startsWith('v=spf1'));

    if (!spfRecord) {
      console.log('❌ SPFレコードが見つかりません');
      console.log('設定したTXTレコード:');
      console.log('v=spf1 a:kab137lab.sakura.ne.jp include:spf.sakura.ne.jp ~all');
      return;
    }

    console.log('✅ SPFレコードが見つかりました:');
    console.log(`📋 ${spfRecord}`);
    console.log('');

    // 構成要素の検証
    console.log('🔧 SPF構成要素の検証:');
    console.log('');

    const elements = spfRecord.split(' ');
    elements.forEach((element, index) => {
      let status = '';
      let description = '';

      switch (true) {
        case element === 'v=spf1':
          status = '✅';
          description = 'SPFバージョン1';
          break;
        case element.startsWith('a:'):
          status = '✅';
          description = `Aレコード許可: ${element.substring(2)}`;
          break;
        case element.startsWith('include:'):
          status = '✅';
          description = `SPF包含: ${element.substring(8)}`;
          break;
        case element === '~all':
          status = '✅';
          description = 'ソフトフェイル (推奨)';
          break;
        case element === '-all':
          status = '⚠️';
          description = 'ハードフェイル (厳格)';
          break;
        case element === '?all':
          status = '🔶';
          description = 'ニュートラル (弱い)';
          break;
        case element === '+all':
          status = '❌';
          description = 'パス (危険)';
          break;
        default:
          status = '🔍';
          description = `不明な要素: ${element}`;
      }

      console.log(`  ${status} ${element.padEnd(30)} ${description}`);
    });

    console.log('');
    console.log('🎯 推奨事項:');
    if (spfRecord.includes('~all')) {
      console.log('✅ 適切な設定です');
    } else if (spfRecord.includes('-all')) {
      console.log('⚠️ 厳格な設定です。問題があればソフトフェイル(~all)を検討');
    } else {
      console.log('❌ "~all"または"-all"の設定を推奨');
    }

    // オンライン検証ツール
    console.log('');
    console.log('🌐 オンライン検証ツール:');
    console.log(`📍 MXToolbox: https://mxtoolbox.com/spf.aspx?domain=${domain}`);
    console.log(`📍 DMARCIAN: https://dmarcian.com/spf-survey/?domain=${domain}`);
    console.log(`📍 Mail Tester: https://www.mail-tester.com/spf/${domain}`);

  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('');
    console.log('💡 手動確認方法:');
    console.log(`nslookup -type=txt ${domain}`);
  }
}

verifySPF();