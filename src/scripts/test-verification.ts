#!/usr/bin/env npx tsx

/**
 * 認証コードシステム テストスクリプト
 *
 * 使用方法:
 * npm run test-verification
 * npx tsx src/scripts/test-verification.ts
 *
 * テスト項目:
 * - 暗号学的乱数の品質テスト
 * - コード生成・検証フロー
 * - レート制限テスト
 * - セキュリティ機能テスト
 */

import { VerificationCodeService } from '../services/verificationCodeService';
import { SecureCodeGenerator } from '../lib/crypto/secureRandom';
import { ComprehensiveValidator } from '../lib/verification/validator';
import { connectDB } from '../lib/mongodb';
import VerificationCode from '../models/VerificationCode';
import VerificationAttempt from '../models/VerificationAttempt';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class VerificationSystemTester {
  private results: TestResult[] = [];
  private testEmail = 'test@example.com';
  private testIP = '192.168.1.100';

  async runAllTests(): Promise<void> {
    console.log('🧪 認証コードシステム テスト開始\n');

    await this.setupTestEnvironment();

    // 基本機能テスト
    await this.testRandomNumberQuality();
    await this.testCodeGeneration();
    await this.testCodeVerification();
    await this.testRateLimit();

    // セキュリティテスト
    await this.testBruteForceProtection();
    await this.testTimingAttackProtection();
    await this.testInputValidation();

    // パフォーマンステスト
    await this.testConcurrentGeneration();
    await this.testDatabaseCleanup();

    await this.cleanupTestEnvironment();
    await this.printResults();
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 テスト環境準備中...');
    await connectDB();

    // テストデータクリーンアップ
    await VerificationCode.deleteMany({ email: this.testEmail });
    await VerificationAttempt.deleteMany({ email: this.testEmail });

    console.log('✅ テスト環境準備完了\n');
  }

  private async cleanupTestEnvironment(): Promise<void> {
    console.log('\n🧹 テストデータクリーンアップ中...');
    await VerificationCode.deleteMany({ email: this.testEmail });
    await VerificationAttempt.deleteMany({ email: this.testEmail });
    console.log('✅ クリーンアップ完了');
  }

  /**
   * 乱数品質テスト
   */
  private async testRandomNumberQuality(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🎲 乱数品質テスト実行中...');

      const sampleSize = 10000;
      const quality = SecureCodeGenerator.testRandomQuality(sampleSize);

      const passed = quality.uniqueRate > 0.99; // 99%以上の一意性
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Random Number Quality',
        passed,
        duration,
        details: {
          sampleSize,
          uniqueRate: quality.uniqueRate,
          duplicates: quality.duplicateCount,
          distribution: quality.distribution,
        },
      });

      console.log(`${passed ? '✅' : '❌'} 乱数品質テスト: ${quality.uniqueRate * 100}% unique`);
    } catch (error) {
      this.results.push({
        testName: 'Random Number Quality',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ 乱数品質テスト失敗:', error);
    }
  }

  /**
   * コード生成テスト
   */
  private async testCodeGeneration(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📧 コード生成テスト実行中...');

      const result = await VerificationCodeService.generateCode({
        email: this.testEmail,
        type: 'email_verification',
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      const passed = !!(result.success && result.code && /^[0-9]{6}$/.test(result.code));
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Code Generation',
        passed,
        duration,
        details: {
          success: result.success,
          hasCode: !!result.code,
          codeFormat: result.code ? /^[0-9]{6}$/.test(result.code) : false,
          expiresAt: result.expiresAt,
          rateLimit: result.rateLimit,
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} コード生成テスト: ${result.success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      this.results.push({
        testName: 'Code Generation',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ コード生成テスト失敗:', error);
    }
  }

  /**
   * コード検証テスト
   */
  private async testCodeVerification(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔍 コード検証テスト実行中...');

      // 有効なコードを生成
      const generateResult = await VerificationCodeService.generateCode({
        email: this.testEmail,
        type: 'email_verification',
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      if (!generateResult.success || !generateResult.code) {
        throw new Error('テスト用コード生成に失敗');
      }

      // 正しいコードで検証
      const verifyResult = await VerificationCodeService.verifyCode({
        email: this.testEmail,
        code: generateResult.code,
        type: 'email_verification',
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      // 間違ったコードで検証
      const wrongCodeResult = await VerificationCodeService.verifyCode({
        email: this.testEmail,
        code: '000000',
        type: 'email_verification',
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      const passed = verifyResult.success && !wrongCodeResult.success;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Code Verification',
        passed,
        duration,
        details: {
          correctCodeResult: verifyResult.success,
          wrongCodeResult: wrongCodeResult.success,
          correctCodeError: verifyResult.error,
          wrongCodeError: wrongCodeResult.error,
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} コード検証テスト: 正解=${verifyResult.success}, 不正解=${!wrongCodeResult.success}`
      );
    } catch (error) {
      this.results.push({
        testName: 'Code Verification',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ コード検証テスト失敗:', error);
    }
  }

  /**
   * レート制限テスト
   */
  private async testRateLimit(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⏱️ レート制限テスト実行中...');

      // 複数回リクエストして制限を確認
      const requests = [];
      for (let i = 0; i < 6; i++) {
        // メール制限（5回）を超える
        requests.push(
          VerificationCodeService.generateCode({
            email: `rate-test-${i}@example.com`,
            type: 'email_verification',
            ipAddress: this.testIP,
            userAgent: 'Test Suite v1.0',
          })
        );
      }

      const results = await Promise.all(requests);
      const successCount = results.filter((r) => r.success).length;
      const rateLimitCount = results.filter(
        (r) => !r.success && r.error?.includes('レート制限')
      ).length;

      const passed = successCount <= 5 && rateLimitCount >= 1;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Rate Limiting',
        passed,
        duration,
        details: {
          totalRequests: requests.length,
          successCount,
          rateLimitCount,
          results: results.map((r) => ({ success: r.success, error: r.error })),
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} レート制限テスト: ${successCount}成功, ${rateLimitCount}制限`
      );
    } catch (error) {
      this.results.push({
        testName: 'Rate Limiting',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ レート制限テスト失敗:', error);
    }
  }

  /**
   * ブルートフォース攻撃対策テスト
   */
  private async testBruteForceProtection(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🛡️ ブルートフォース対策テスト実行中...');

      // 有効なコードを生成
      const generateResult = await VerificationCodeService.generateCode({
        email: `bruteforce-test@example.com`,
        type: 'email_verification',
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      if (!generateResult.success) {
        throw new Error('テスト用コード生成に失敗');
      }

      // 3回失敗してロック状態を確認
      const wrongAttempts = [];
      for (let i = 0; i < 4; i++) {
        wrongAttempts.push(
          VerificationCodeService.verifyCode({
            email: `bruteforce-test@example.com`,
            code: `00000${i}`, // 間違ったコード
            type: 'email_verification',
            ipAddress: this.testIP,
            userAgent: 'Test Suite v1.0',
          })
        );
      }

      const attemptResults = await Promise.all(wrongAttempts);
      const lockedResults = attemptResults.filter((r) => r.error?.includes('locked'));

      const passed = lockedResults.length > 0;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Brute Force Protection',
        passed,
        duration,
        details: {
          totalAttempts: attemptResults.length,
          lockedAttempts: lockedResults.length,
          lastResult: attemptResults[attemptResults.length - 1],
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} ブルートフォース対策テスト: ${lockedResults.length}ロック`
      );
    } catch (error) {
      this.results.push({
        testName: 'Brute Force Protection',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ ブルートフォース対策テスト失敗:', error);
    }
  }

  /**
   * タイミング攻撃対策テスト
   */
  private async testTimingAttackProtection(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⏰ タイミング攻撃対策テスト実行中...');

      // 存在しないメール vs 間違ったコードのレスポンス時間比較
      const timingTests = await Promise.all([
        this.measureVerificationTime('nonexistent@example.com', '123456'),
        this.measureVerificationTime(this.testEmail, '654321'), // 実際に存在するメール
      ]);

      const [nonexistentTime, wrongCodeTime] = timingTests;
      const timeDifference = Math.abs(nonexistentTime - wrongCodeTime);

      // タイミング差は100ms以内であるべき
      const passed = timeDifference < 100;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Timing Attack Protection',
        passed,
        duration,
        details: {
          nonexistentEmailTime: nonexistentTime,
          wrongCodeTime: wrongCodeTime,
          timeDifference,
          threshold: 100,
        },
      });

      console.log(`${passed ? '✅' : '❌'} タイミング攻撃対策テスト: ${timeDifference}ms差`);
    } catch (error) {
      this.results.push({
        testName: 'Timing Attack Protection',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ タイミング攻撃対策テスト失敗:', error);
    }
  }

  private async measureVerificationTime(email: string, code: string): Promise<number> {
    const start = Date.now();
    await VerificationCodeService.verifyCode({
      email,
      code,
      type: 'email_verification',
      ipAddress: this.testIP,
      userAgent: 'Test Suite v1.0',
    });
    return Date.now() - start;
  }

  /**
   * 入力バリデーションテスト
   */
  private async testInputValidation(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('✅ 入力バリデーションテスト実行中...');

      const testCases = [
        { email: '', code: '123456', shouldFail: true },
        { email: 'invalid-email', code: '123456', shouldFail: true },
        { email: 'test@example.com', code: '', shouldFail: true },
        { email: 'test@example.com', code: '12345', shouldFail: true },
        { email: 'test@example.com', code: '1234567', shouldFail: true },
        { email: 'test@example.com', code: 'abcdef', shouldFail: true },
        { email: 'test@example.com', code: '123456', shouldFail: false },
      ];

      const results = testCases.map((testCase) => {
        const validation = ComprehensiveValidator.validateVerificationRequest({
          email: testCase.email,
          code: testCase.code,
          type: 'email_verification',
          ipAddress: this.testIP,
          userAgent: 'Test Suite v1.0',
        });

        const passed = testCase.shouldFail ? !validation.isValid : validation.isValid;
        return { testCase, passed, validation };
      });

      const allPassed = results.every((r) => r.passed);
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Input Validation',
        passed: allPassed,
        duration,
        details: {
          totalTests: testCases.length,
          passedTests: results.filter((r) => r.passed).length,
          results: results,
        },
      });

      console.log(
        `${allPassed ? '✅' : '❌'} 入力バリデーションテスト: ${results.filter((r) => r.passed).length}/${testCases.length}`
      );
    } catch (error) {
      this.results.push({
        testName: 'Input Validation',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ 入力バリデーションテスト失敗:', error);
    }
  }

  /**
   * 同時実行テスト
   */
  private async testConcurrentGeneration(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⚡ 同時実行テスト実行中...');

      // 10個の同時リクエスト
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        VerificationCodeService.generateCode({
          email: `concurrent-test-${i}@example.com`,
          type: 'email_verification',
          ipAddress: this.testIP,
          userAgent: 'Test Suite v1.0',
        })
      );

      const results = await Promise.all(concurrentRequests);
      const successCount = results.filter((r) => r.success).length;
      const uniqueCodes = new Set(results.filter((r) => r.success).map((r) => r.code)).size;

      // 全て成功し、全て異なるコードであるべき
      const passed = successCount === 10 && uniqueCodes === successCount;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Concurrent Generation',
        passed,
        duration,
        details: {
          totalRequests: 10,
          successCount,
          uniqueCodes,
          hasDuplicates: uniqueCodes !== successCount,
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} 同時実行テスト: ${successCount}成功, ${uniqueCodes}ユニーク`
      );
    } catch (error) {
      this.results.push({
        testName: 'Concurrent Generation',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ 同時実行テスト失敗:', error);
    }
  }

  /**
   * データベースクリーンアップテスト
   */
  private async testDatabaseCleanup(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🧹 データベースクリーンアップテスト実行中...');

      // 期限切れコードを作成
      const expiredCode = new VerificationCode({
        email: 'cleanup-test@example.com',
        code: '999999',
        type: 'email_verification',
        expiresAt: new Date(Date.now() - 60 * 1000), // 1分前に期限切れ
        ipAddress: this.testIP,
        userAgent: 'Test Suite v1.0',
      });

      await expiredCode.save();

      // クリーンアップ実行
      const cleanupResult = await VerificationCodeService.cleanupExpiredCodes();

      const passed = cleanupResult.deletedCount >= 1;
      const duration = Date.now() - startTime;

      this.results.push({
        testName: 'Database Cleanup',
        passed,
        duration,
        details: {
          deletedCount: cleanupResult.deletedCount,
          executionTime: cleanupResult.executionTime,
        },
      });

      console.log(
        `${passed ? '✅' : '❌'} データベースクリーンアップテスト: ${cleanupResult.deletedCount}削除`
      );
    } catch (error) {
      this.results.push({
        testName: 'Database Cleanup',
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });

      console.log('❌ データベースクリーンアップテスト失敗:', error);
    }
  }

  private async printResults(): Promise<void> {
    const passedTests = this.results.filter((r) => r.passed).length;
    const totalTests = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 テスト結果サマリー');
    console.log('='.repeat(60));
    console.log(
      `✅ 合格: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`
    );
    console.log(`⏱️ 総実行時間: ${totalDuration}ms`);
    console.log();

    this.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      console.log(
        `${status} ${result.testName.padEnd(30)} ${result.duration.toString().padStart(4)}ms`
      );

      if (!result.passed && result.error) {
        console.log(`   ↳ Error: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));

    if (passedTests === totalTests) {
      console.log('🎉 全テストが合格しました！');
    } else {
      console.log(`⚠️ ${totalTests - passedTests}個のテストが失敗しました。`);
      process.exit(1);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const tester = new VerificationSystemTester();
  tester.runAllTests().catch((error) => {
    console.error('❌ テスト実行中にエラー:', error);
    process.exit(1);
  });
}
