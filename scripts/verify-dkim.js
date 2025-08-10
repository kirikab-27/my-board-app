const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * DKIM レコード検証ツール
 * Usage: node scripts/verify-dkim.js [domain] [selector]
 */

const domain = process.argv[2] || 'kab137lab.com';
const selector = process.argv[3];

async function verifyDKIM() {
  console.log('🔍 DKIM レコード検証ツール');
  console.log('='.repeat(60));
  console.log(`📡 対象ドメイン: ${domain}`);
  
  if (selector) {
    console.log(`🏷️  セレクタ: ${selector}`);
  }
  
  console.log('');

  try {
    // 1. DKIM レコード確認
    if (selector) {
      console.log('📌 DKIM レコード確認');
      console.log('-'.repeat(40));
      
      const dkimDomain = `${selector}._domainkey.${domain}`;
      
      try {
        const { stdout: dkimResult } = await execPromise(`nslookup -type=txt ${dkimDomain} 8.8.8.8`);
        
        if (dkimResult.includes('v=DKIM1')) {
          console.log('✅ DKIM レコードが見つかりました');
          
          // DKIM レコードの詳細解析
          const txtRecords = dkimResult
            .split('\n')
            .filter(line => line.includes('text ='))
            .map(line => line.replace(/.*text = "(.+)"/, '$1'))
            .join('');

          if (txtRecords.includes('v=DKIM1')) {
            console.log('📝 DKIM レコード内容:');
            console.log(`   ${txtRecords}`);
            console.log('');
            
            // DKIM パラメータ解析
            console.log('🔧 DKIM パラメータ解析:');
            console.log('-'.repeat(30));
            
            const params = txtRecords.split(';').map(p => p.trim());
            params.forEach(param => {
              let status = '';
              let description = '';
              
              if (param.startsWith('v=DKIM1')) {
                status = '✅';
                description = 'DKIM バージョン 1';
              } else if (param.startsWith('k=rsa')) {
                status = '✅';
                description = 'RSA 暗号化アルゴリズム';
              } else if (param.startsWith('k=ed25519')) {
                status = '✅';
                description = 'Ed25519 暗号化アルゴリズム';
              } else if (param.startsWith('p=')) {
                status = '✅';
                const keyLength = param.substring(2).length;
                description = `公開鍵 (長さ: ${keyLength}文字)`;
              } else if (param.startsWith('t=y')) {
                status = '🟡';
                description = 'テストモード（本番では削除推奨）';
              } else if (param.startsWith('t=s')) {
                status = '🔒';
                description = 'ストリクトモード';
              } else if (param === 's=email') {
                status = '📧';
                description = 'メールサービス限定';
              } else if (param === 's=*') {
                status = '🌐';
                description = '全サービス対象';
              } else if (param.startsWith('h=')) {
                status = '📋';
                description = `ハッシュアルゴリズム: ${param.substring(2)}`;
              } else {
                status = '🔍';
                description = '未知のパラメータ';
              }
              
              console.log(`  ${status} ${param.padEnd(20)} ${description}`);
            });
          }
        } else {
          console.log('❌ DKIM レコードが見つかりません');
          console.log(`   確認対象: ${dkimDomain}`);
        }
      } catch (error) {
        console.log('❌ DKIM レコードの確認に失敗');
        console.log(`   エラー: ${error.message}`);
      }
      console.log('');
    } else {
      console.log('⚠️  セレクタが指定されていません');
      console.log('   使用方法: node scripts/verify-dkim.js kab137lab.com [selector]');
      console.log('');
    }

    // 2. DMARC レコード確認
    console.log('📌 DMARC レコード確認');
    console.log('-'.repeat(40));
    
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const { stdout: dmarcResult } = await execPromise(`nslookup -type=txt ${dmarcDomain} 8.8.8.8`);
      
      if (dmarcResult.includes('v=DMARC1')) {
        console.log('✅ DMARC レコードが見つかりました');
        
        const dmarcRecord = dmarcResult
          .split('\n')
          .filter(line => line.includes('text ='))
          .map(line => line.replace(/.*text = "(.+)"/, '$1'))
          .join('');

        console.log('📝 DMARC レコード内容:');
        console.log(`   ${dmarcRecord}`);
        console.log('');
        
        // DMARC パラメータ解析
        console.log('🔧 DMARC パラメータ解析:');
        console.log('-'.repeat(30));
        
        const dmarcParams = dmarcRecord.split(';').map(p => p.trim());
        dmarcParams.forEach(param => {
          let status = '';
          let description = '';
          
          if (param.startsWith('v=DMARC1')) {
            status = '✅';
            description = 'DMARC バージョン 1';
          } else if (param.startsWith('p=none')) {
            status = '🟡';
            description = 'ポリシー: 監視のみ（推奨開始設定）';
          } else if (param.startsWith('p=quarantine')) {
            status = '🟠';
            description = 'ポリシー: 検疫（迷惑メールフォルダ）';
          } else if (param.startsWith('p=reject')) {
            status = '🔴';
            description = 'ポリシー: 拒否（厳格）';
          } else if (param.startsWith('rua=')) {
            status = '📊';
            description = `集計レポート送信先: ${param.substring(4)}`;
          } else if (param.startsWith('ruf=')) {
            status = '🚨';
            description = `失敗レポート送信先: ${param.substring(4)}`;
          } else if (param.startsWith('sp=')) {
            status = '🏷️';
            description = `サブドメインポリシー: ${param.substring(3)}`;
          } else if (param.startsWith('aspf=')) {
            status = '🔍';
            description = `SPF整合性: ${param.substring(5)} (r=緩い, s=厳格)`;
          } else if (param.startsWith('adkim=')) {
            status = '🔐';
            description = `DKIM整合性: ${param.substring(6)} (r=緩い, s=厳格)`;
          } else {
            status = '🔍';
            description = '未知のパラメータ';
          }
          
          console.log(`  ${status} ${param.padEnd(25)} ${description}`);
        });
        
      } else {
        console.log('❌ DMARC レコードが見つかりません');
        console.log(`   確認対象: ${dmarcDomain}`);
      }
    } catch (error) {
      console.log('❌ DMARC レコードの確認に失敗');
      console.log(`   エラー: ${error.message}`);
    }
    console.log('');

    // 3. SPF レコード再確認
    console.log('📌 SPF レコード確認');
    console.log('-'.repeat(40));
    
    try {
      const { stdout: spfResult } = await execPromise(`nslookup -type=txt ${domain} 8.8.8.8`);
      
      if (spfResult.includes('v=spf1')) {
        console.log('✅ SPF レコードが見つかりました');
        
        const spfRecord = spfResult
          .split('\n')
          .filter(line => line.includes('v=spf1'))
          .map(line => line.replace(/.*"(v=spf1[^"]*)".*/, '$1'))
          .join('');

        console.log(`📝 SPF レコード: ${spfRecord}`);
        
        // 推奨事項
        if (spfRecord.includes('~all')) {
          console.log('✅ ソフトフェイル設定（推奨）');
        } else if (spfRecord.includes('-all')) {
          console.log('⚠️ ハードフェイル設定（厳格）');
        }
        
      } else {
        console.log('❌ SPF レコードが見つかりません');
      }
    } catch (error) {
      console.log('❌ SPF レコードの確認に失敗');
    }
    console.log('');

    // 4. 総合評価と推奨事項
    console.log('🎯 総合評価と推奨事項');
    console.log('='.repeat(60));
    console.log('');
    
    if (selector) {
      console.log('📧 メール認証設定状況:');
      console.log('  • SPF: 設定確認済み');
      console.log('  • DKIM: 設定確認' + (selector ? '済み' : '要確認'));
      console.log('  • DMARC: 設定確認済み');
      console.log('');
    }
    
    console.log('🔍 オンライン検証ツール:');
    console.log(`  • MXToolbox: https://mxtoolbox.com/dkim.aspx?domain=${domain}&selector=${selector || 'SELECTOR'}`);
    console.log(`  • DMARC Analyzer: https://www.dmarcanalyzer.com/dmarc/dmarc-record-check/?domain=${domain}`);
    console.log(`  • Mail Tester: https://www.mail-tester.com/`);
    console.log('');
    
    console.log('📤 メール送信テスト:');
    console.log('  node scripts/test-dkim-email.js');

  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error.message);
  }
}

verifyDKIM();