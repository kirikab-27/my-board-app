import 'dotenv/config';
import { ReactEmailService } from '@/lib/email/react-email-sender';

async function testVerificationSystem() {
  console.log('=== 検証コードシステム完全テスト開始 ===\n');

  try {
    // 1. メール送信テスト
    console.log('1. メール送信テスト...');
    const testEmail = 'test@example.com';
    const testCode = '123456';
    
    const emailResult = await ReactEmailService.sendVerificationCodeEmail(
      testEmail,
      testCode,
      'admin_registration',
      'テストユーザー'
    );
    
    if (emailResult.success) {
      console.log('✅ メール送信成功');
      console.log(`   送信先: ${testEmail}`);
      console.log(`   コード: ${testCode}`);
    } else {
      console.error('❌ メール送信失敗:', emailResult.error);
    }

    // 2. 各種タイプのメールテスト
    console.log('\n2. 各種タイプのメールテスト...');
    
    const types: Array<'admin_registration' | 'password_reset' | '2fa' | 'email_verification'> = [
      'admin_registration',
      'password_reset',
      '2fa',
      'email_verification'
    ];
    
    for (const type of types) {
      console.log(`   - ${type} タイプのテスト...`);
      const result = await ReactEmailService.sendVerificationCodeEmail(
        testEmail,
        testCode,
        type,
        'テストユーザー'
      );
      
      if (result.success) {
        console.log(`     ✅ ${type} メール送信成功`);
      } else {
        console.error(`     ❌ ${type} メール送信失敗:`, result.error);
      }
    }

    console.log('\n=== テスト完了 ===');
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  }
}

// テスト実行
testVerificationSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });