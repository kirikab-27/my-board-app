import crypto from 'crypto';

/**
 * 暗号学的に安全な乱数生成クラス
 * 
 * ⚠️ 重要: Math.random() は予測可能なため絶対に使用禁止
 * crypto.randomInt() のみ使用すること（Node.js 14.10.0以降）
 * 
 * 実際のカジノ事件等で予測可能な乱数による被害が発生しているため、
 * 最高レベルのセキュリティを実装
 */

export class SecureCodeGenerator {
  private static readonly CODE_MIN = 100000;
  private static readonly CODE_MAX = 999999;
  private static readonly TOKEN_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  /**
   * 暗号学的に安全な6桁認証コード生成
   * @returns {string} 100000-999999の6桁数字文字列
   */
  static generateCode(): string {
    try {
      // crypto.randomInt() は暗号学的に安全な乱数生成器
      // CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) を使用
      const code = crypto.randomInt(this.CODE_MIN, this.CODE_MAX + 1);
      return code.toString();
    } catch (error) {
      console.error('❌ [CRITICAL] 暗号学的乱数生成エラー:', error);
      throw new Error('セキュア乱数生成に失敗しました');
    }
  }
  
  /**
   * 重複チェック付き認証コード生成
   * @param {Function} isDuplicateCheck - 重複チェック関数
   * @param {number} maxAttempts - 最大試行回数（デフォルト100回）
   * @returns {Promise<string>} 一意な6桁認証コード
   */
  static async generateUniqueCode(
    isDuplicateCheck: (code: string) => Promise<boolean>,
    maxAttempts: number = 100
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateCode();
      
      if (!(await isDuplicateCheck(code))) {
        console.log(`✅ 一意なコード生成成功 (試行: ${attempt + 1}/${maxAttempts})`);
        return code;
      }
      
      // 重複した場合の警告
      console.warn(`⚠️ コード重複発生: ${code} (試行: ${attempt + 1}/${maxAttempts})`);
      
      // 連続重複の場合、少し待機（DoS攻撃対策）
      if (attempt > 10) {
        await new Promise(resolve => setTimeout(resolve, attempt * 10));
      }
    }
    
    console.error(`❌ [CRITICAL] ${maxAttempts}回試行してもユニークコード生成できず`);
    throw new Error('一意な認証コードの生成に失敗しました');
  }
  
  /**
   * セキュアなトークン生成（URL用）
   * @param {number} length - トークンの長さ（バイト数）
   * @returns {string} ランダムなhex文字列
   */
  static generateToken(length: number = 32): string {
    if (length < 16 || length > 64) {
      throw new Error('トークン長は16-64バイトの範囲で指定してください');
    }
    
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      console.error('❌ トークン生成エラー:', error);
      throw new Error('セキュアトークンの生成に失敗しました');
    }
  }
  
  /**
   * 英数字ランダム文字列生成
   * @param {number} length - 文字列の長さ
   * @returns {string} ランダムな英数字文字列
   */
  static generateAlphanumeric(length: number = 16): string {
    if (length < 4 || length > 128) {
      throw new Error('文字列長は4-128文字の範囲で指定してください');
    }
    
    try {
      const result: string[] = [];
      const charsetLength = this.TOKEN_CHARSET.length;
      
      for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charsetLength);
        result.push(this.TOKEN_CHARSET[randomIndex]);
      }
      
      return result.join('');
    } catch (error) {
      console.error('❌ 英数字文字列生成エラー:', error);
      throw new Error('ランダム文字列の生成に失敗しました');
    }
  }
  
  /**
   * セキュアなセッションID生成
   * @returns {string} 64文字のhex文字列
   */
  static generateSessionId(): string {
    return this.generateToken(32); // 32バイト = 64文字hex
  }
  
  /**
   * CSRFトークン生成
   * @returns {string} CSRFトークン
   */
  static generateCSRFToken(): string {
    return this.generateToken(24); // 24バイト = 48文字hex
  }
  
  /**
   * パスワードリセット用トークン生成
   * @returns {string} リセット用トークン
   */
  static generateResetToken(): string {
    return this.generateToken(40); // 40バイト = 80文字hex
  }
  
  /**
   * 乱数品質テスト（開発・テスト用）
   * @param {number} sampleSize - サンプルサイズ
   * @returns {Object} 乱数品質統計
   */
  static testRandomQuality(sampleSize: number = 10000): {
    samples: string[];
    uniqueCount: number;
    duplicateCount: number;
    uniqueRate: number;
    distribution: Record<string, number>;
  } {
    const samples: string[] = [];
    const seen = new Set<string>();
    const distribution: Record<string, number> = {};
    
    for (let i = 0; i < sampleSize; i++) {
      const code = this.generateCode();
      samples.push(code);
      seen.add(code);
      
      // 先頭桁の分布確認
      const firstDigit = code[0];
      distribution[firstDigit] = (distribution[firstDigit] || 0) + 1;
    }
    
    const uniqueCount = seen.size;
    const duplicateCount = sampleSize - uniqueCount;
    const uniqueRate = uniqueCount / sampleSize;
    
    return {
      samples,
      uniqueCount,
      duplicateCount,
      uniqueRate,
      distribution,
    };
  }
  
  /**
   * ⚠️ 危険な実装例（教育目的・使用厳禁）
   * Math.random() は予測可能なため実装してはならない
   */
  private static DANGEROUS_DO_NOT_IMPLEMENT_Math_Random_Example(): string {
    // この実装は予測攻撃に脆弱
    // 線形合同生成器やメルセンヌ・ツイスターは予測可能
    // カジノやオンラインギャンブルで実際の被害事例あり
    
    // 🚨 絶対に実装してはならないコード例:
    // const unsafeCode = Math.floor(Math.random() * 900000) + 100000;
    // return unsafeCode.toString();
    
    throw new Error('Math.random() の使用は厳禁です');
  }
}

/**
 * 乱数エントロピーソース管理
 */
export class EntropyManager {
  /**
   * システムエントロピー状態確認
   * @returns {boolean} 十分なエントロピーが利用可能か
   */
  static hasEnoughEntropy(): boolean {
    try {
      // Node.js の crypto モジュールはOSの /dev/urandom や Windows CryptGenRandom を使用
      // これらは十分なエントロピーを提供する
      crypto.randomBytes(1);
      return true;
    } catch (error) {
      console.error('❌ エントロピー不足:', error);
      return false;
    }
  }
  
  /**
   * エントロピープール状態取得（Unix系のみ）
   */
  static getEntropyInfo(): {
    available: boolean;
    source: string;
    warning?: string;
  } {
    const available = this.hasEnoughEntropy();
    
    // プラットフォーム検出
    const platform = process.platform;
    let source = 'Unknown';
    let warning;
    
    switch (platform) {
      case 'linux':
        source = '/dev/urandom';
        break;
      case 'darwin':
        source = '/dev/urandom (macOS)';
        break;
      case 'win32':
        source = 'CryptGenRandom (Windows)';
        break;
      default:
        source = `${platform} system random`;
        warning = 'プラットフォーム固有のエントロピー確認が必要';
    }
    
    return { available, source, warning };
  }
}

export default SecureCodeGenerator;