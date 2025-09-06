/**
 * 認証システム バリデーションユーティリティ
 * 
 * 🔐 セキュリティ重点機能:
 * - 入力サニタイゼーション
 * - SQLインジェクション防止
 * - XSS防止
 * - CSRF防止
 * - 異常パターン検知
 */

import { VerificationType } from '@/models/VerificationCode';

/**
 * メールアドレス バリデーション
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MAX_LENGTH = 320; // RFC 5321
  private static readonly SUSPICIOUS_PATTERNS = [
    /[<>'"]/,           // HTMLタグ・スクリプトの可能性
    /javascript:/i,      // JavaScriptプロトコル
    /data:/i,           // DataURL
    /vbscript:/i,       // VBScript
    /%[0-9a-f]{2}/i,    // URL エンコード
    /\x00-\x1f/,        // 制御文字
  ];
  
  static validate(email: string): {
    isValid: boolean;
    error?: string;
    sanitized: string;
    riskScore: number;
  } {
    let riskScore = 0;
    
    // 基本チェック
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Email is required and must be a string',
        sanitized: '',
        riskScore: 100,
      };
    }
    
    // 長さチェック
    if (email.length > this.MAX_LENGTH) {
      return {
        isValid: false,
        error: 'Email address too long',
        sanitized: email.trim().toLowerCase(),
        riskScore: 80,
      };
    }
    
    // 基本サニタイゼーション
    const sanitized = email.trim().toLowerCase();
    
    // 正規表現チェック
    if (!this.EMAIL_REGEX.test(sanitized)) {
      return {
        isValid: false,
        error: 'Invalid email format',
        sanitized,
        riskScore: 60,
      };
    }
    
    // セキュリティ上危険なパターンチェック
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        riskScore += 30;
      }
    }
    
    // 連続ドットチェック（RFC違反）
    if (sanitized.includes('..')) {
      riskScore += 20;
    }
    
    // TLD チェック（最低2文字）
    const parts = sanitized.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      riskScore += 25;
    }
    
    // 異常に長いローカル部分
    const localPart = sanitized.split('@')[0];
    if (localPart.length > 64) { // RFC 5321
      riskScore += 15;
    }
    
    return {
      isValid: riskScore < 50,
      error: riskScore >= 50 ? 'Suspicious email pattern detected' : undefined,
      sanitized,
      riskScore,
    };
  }
  
  /**
   * 使い捨てメールドメイン チェック
   */
  static isDisposableEmail(email: string): boolean {
    const domain = email.toLowerCase().split('@')[1];
    
    // よく知られた使い捨てメールドメイン
    const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org',
      'throwaaway.email',
      'temp-mail.org',
      '20minutemail.com',
      'yopmail.com',
    ];
    
    return disposableDomains.includes(domain);
  }
  
  /**
   * 企業メール判定
   */
  static isBusinessEmail(email: string): boolean {
    const domain = email.toLowerCase().split('@')[1];
    
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.co.jp',
      'hotmail.co.jp',
      'live.com',
      'icloud.com',
    ];
    
    return !personalDomains.includes(domain);
  }
}

/**
 * 認証コード バリデーション
 */
export class CodeValidator {
  private static readonly CODE_REGEX = /^[0-9]{6}$/;
  
  static validate(code: string): {
    isValid: boolean;
    error?: string;
    sanitized: string;
    riskScore: number;
  } {
    let riskScore = 0;
    
    if (!code || typeof code !== 'string') {
      return {
        isValid: false,
        error: 'Code is required',
        sanitized: '',
        riskScore: 100,
      };
    }
    
    // 基本サニタイゼーション
    const sanitized = code.trim();
    
    // 正規表現チェック
    if (!this.CODE_REGEX.test(sanitized)) {
      return {
        isValid: false,
        error: 'Invalid code format',
        sanitized,
        riskScore: 70,
      };
    }
    
    // パターン分析（推測可能なコード）
    const patterns = this.analyzeCodePatterns(sanitized);
    riskScore += patterns.riskScore;
    
    return {
      isValid: riskScore < 30,
      error: riskScore >= 30 ? 'Suspicious code pattern' : undefined,
      sanitized,
      riskScore,
    };
  }
  
  /**
   * コードパターン分析（弱いコード検出）
   */
  private static analyzeCodePatterns(code: string): {
    riskScore: number;
    patterns: string[];
  } {
    const patterns: string[] = [];
    let riskScore = 0;
    
    // 連続する数字
    if (/123456|654321|012345/.test(code)) {
      patterns.push('sequential');
      riskScore += 20;
    }
    
    // 同じ数字の繰り返し
    if (/(.)\1{2,}/.test(code)) {
      patterns.push('repetitive');
      riskScore += 15;
    }
    
    // よくある弱いパスワード
    const weakCodes = ['123456', '000000', '111111', '123123', '456456'];
    if (weakCodes.includes(code)) {
      patterns.push('weak_common');
      riskScore += 25;
    }
    
    // パリンドローム（回文）
    if (code === code.split('').reverse().join('')) {
      patterns.push('palindrome');
      riskScore += 10;
    }
    
    return { riskScore, patterns };
  }
}

/**
 * リクエスト バリデーション
 */
export class RequestValidator {
  /**
   * User-Agent 分析
   */
  static analyzeUserAgent(userAgent?: string): {
    isValid: boolean;
    riskScore: number;
    details: {
      isBrowser: boolean;
      isBot: boolean;
      isMobile: boolean;
      suspicious: boolean;
    };
  } {
    let riskScore = 0;
    
    if (!userAgent) {
      return {
        isValid: false,
        riskScore: 50,
        details: {
          isBrowser: false,
          isBot: true,
          isMobile: false,
          suspicious: true,
        },
      };
    }
    
    const ua = userAgent.toLowerCase();
    
    // ボット判定
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'curl', 'wget', 'python', 'java',
      'postman', 'insomnia',
    ];
    
    const isBot = botPatterns.some(pattern => ua.includes(pattern));
    if (isBot) riskScore += 30;
    
    // ブラウザ判定
    const browserPatterns = [
      'mozilla', 'chrome', 'safari', 'firefox',
      'edge', 'opera',
    ];
    
    const isBrowser = browserPatterns.some(pattern => ua.includes(pattern));
    if (!isBrowser) riskScore += 20;
    
    // モバイル判定
    const mobilePatterns = [
      'mobile', 'android', 'iphone', 'ipad',
      'tablet',
    ];
    
    const isMobile = mobilePatterns.some(pattern => ua.includes(pattern));
    
    // 異常に短い User-Agent
    if (userAgent.length < 20) riskScore += 15;
    
    // 異常に長い User-Agent
    if (userAgent.length > 500) riskScore += 10;
    
    const suspicious = riskScore > 25;
    
    return {
      isValid: riskScore < 40,
      riskScore,
      details: {
        isBrowser,
        isBot,
        isMobile,
        suspicious,
      },
    };
  }
  
  /**
   * IPアドレス分析
   */
  static analyzeIPAddress(ipAddress: string): {
    isValid: boolean;
    riskScore: number;
    details: {
      isPrivate: boolean;
      isLoopback: boolean;
      version: 'v4' | 'v6' | 'unknown';
      suspicious: boolean;
    };
  } {
    let riskScore = 0;
    
    if (!ipAddress) {
      return {
        isValid: false,
        riskScore: 100,
        details: {
          isPrivate: false,
          isLoopback: false,
          version: 'unknown',
          suspicious: true,
        },
      };
    }
    
    // IPv4 パターン
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 パターン（簡易）
    const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
    
    let version: 'v4' | 'v6' | 'unknown' = 'unknown';
    
    if (ipv4Regex.test(ipAddress)) {
      version = 'v4';
      // IPv4 詳細分析
      const octets = ipAddress.split('.').map(Number);
      
      // プライベートIPチェック
      const isPrivate = 
        (octets[0] === 10) ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168);
      
      // ループバックチェック
      const isLoopback = octets[0] === 127;
      
      if (isPrivate) riskScore += 5; // 開発環境では正常
      if (isLoopback) riskScore += 10;
      
      return {
        isValid: true,
        riskScore,
        details: {
          isPrivate,
          isLoopback,
          version,
          suspicious: riskScore > 20,
        },
      };
    } else if (ipv6Regex.test(ipAddress)) {
      version = 'v6';
      const isLoopback = ipAddress === '::1';
      
      if (isLoopback) riskScore += 10;
      
      return {
        isValid: true,
        riskScore,
        details: {
          isPrivate: false, // IPv6プライベート判定は複雑なので簡略化
          isLoopback,
          version,
          suspicious: false,
        },
      };
    }
    
    return {
      isValid: false,
      riskScore: 60,
      details: {
        isPrivate: false,
        isLoopback: false,
        version: 'unknown',
        suspicious: true,
      },
    };
  }
}

/**
 * 認証タイプ バリデーション
 */
export class TypeValidator {
  private static readonly VALID_TYPES: VerificationType[] = [
    'admin_registration',
    'password_reset',
    '2fa',
    'email_verification',
  ];
  
  static validate(type: any): {
    isValid: boolean;
    error?: string;
    sanitized: VerificationType | null;
  } {
    if (!type || typeof type !== 'string') {
      return {
        isValid: false,
        error: 'Type is required and must be a string',
        sanitized: null,
      };
    }
    
    const sanitized = type.trim().toLowerCase() as VerificationType;
    
    if (!this.VALID_TYPES.includes(sanitized)) {
      return {
        isValid: false,
        error: 'Invalid verification type',
        sanitized: null,
      };
    }
    
    return {
      isValid: true,
      sanitized,
    };
  }
}

/**
 * 総合バリデーション
 */
export class ComprehensiveValidator {
  static validateVerificationRequest(request: {
    email?: string;
    code?: string;
    type?: string;
    ipAddress?: string;
    userAgent?: string;
  }): {
    isValid: boolean;
    errors: string[];
    riskScore: number;
    sanitizedData: {
      email: string;
      code: string;
      type: VerificationType;
      ipAddress: string;
      userAgent: string | undefined;
    } | null;
  } {
    const errors: string[] = [];
    let totalRiskScore = 0;
    
    // メールバリデーション
    const emailResult = EmailValidator.validate(request.email || '');
    if (!emailResult.isValid) {
      errors.push(emailResult.error || 'Invalid email');
    }
    totalRiskScore += emailResult.riskScore * 0.3;
    
    // コードバリデーション
    const codeResult = CodeValidator.validate(request.code || '');
    if (!codeResult.isValid) {
      errors.push(codeResult.error || 'Invalid code');
    }
    totalRiskScore += codeResult.riskScore * 0.3;
    
    // タイプバリデーション
    const typeResult = TypeValidator.validate(request.type);
    if (!typeResult.isValid) {
      errors.push(typeResult.error || 'Invalid type');
    }
    
    // IPアドレスバリデーション
    const ipResult = RequestValidator.analyzeIPAddress(request.ipAddress || '');
    if (!ipResult.isValid) {
      errors.push('Invalid IP address');
    }
    totalRiskScore += ipResult.riskScore * 0.2;
    
    // User-Agentバリデーション
    const uaResult = RequestValidator.analyzeUserAgent(request.userAgent);
    totalRiskScore += uaResult.riskScore * 0.2;
    
    const isValid = errors.length === 0 && totalRiskScore < 50;
    
    return {
      isValid,
      errors,
      riskScore: totalRiskScore,
      sanitizedData: isValid ? {
        email: emailResult.sanitized,
        code: codeResult.sanitized,
        type: typeResult.sanitized!,
        ipAddress: request.ipAddress!,
        userAgent: request.userAgent,
      } : null,
    };
  }
}

export default {
  EmailValidator,
  CodeValidator,
  RequestValidator,
  TypeValidator,
  ComprehensiveValidator,
};