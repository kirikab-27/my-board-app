/**
 * ミドルウェアセキュリティ機能
 * CSRF保護・レート制限・IP制限統合
 */

import type { NextRequest } from 'next/server';
import { logRateLimitExceeded, logSecurityEvent } from '@/lib/security/audit-logger';

interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

/**
 * 基本的な率制限チェック（メモリベース）
 * 本格運用時はRedisやDBに置き換え推奨
 */
class SimpleRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): SecurityCheckResult {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // 記録がないか、ウィンドウが過ぎている場合
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true };
    }

    // 制限に達している場合
    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    // カウント増加
    record.count++;
    this.requests.set(identifier, record);
    return { allowed: true };
  }

  // 定期的なクリーンアップ（メモリ使用量対策）
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// グローバルレート制限インスタンス（要件に合わせて調整）
const globalRateLimit = new SimpleRateLimit(5, 60 * 1000);        // 1分間に5回（要件準拠）
const authRateLimit = new SimpleRateLimit(5, 60 * 1000);          // 1分間に5回（認証関連も同様）
const apiRateLimit = new SimpleRateLimit(10, 60 * 1000);          // API用: 1分間に10回（少し緩め）

/**
 * クライアントIPアドレスを取得
 */
export const getClientIP = (req: NextRequest): string => {
  // Cloudflare
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // 他のプロキシ
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  // Vercel
  const xVercelForwardedFor = req.headers.get('x-vercel-forwarded-for');
  if (xVercelForwardedFor) return xVercelForwardedFor;

  return req.ip || 'unknown';
};

/**
 * レート制限チェック（要件準拠: 1分5回制限）
 */
export const checkRateLimit = (req: NextRequest): SecurityCheckResult => {
  const ip = getClientIP(req);
  const pathname = req.nextUrl.pathname;

  // API関連のパスは少し緩いレート制限
  if (pathname.startsWith('/api/posts') || 
      pathname.startsWith('/api/profile') ||
      pathname.startsWith('/api/security')) {
    const result = apiRateLimit.check(ip);
    if (!result.allowed) {
      // レート制限違反をログに記録
      logRateLimitExceeded(req, `API ${pathname}`, undefined).catch(console.error);
    }
    return result;
  }

  // 認証関連のパスは厳格なレート制限
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') ||
      pathname.startsWith('/api/auth/')) {
    const result = authRateLimit.check(ip);
    if (!result.allowed) {
      // レート制限違反をログに記録
      logRateLimitExceeded(req, `Auth ${pathname}`, undefined).catch(console.error);
    }
    return result;
  }

  // 一般的なレート制限（要件: 1分5回）
  const result = globalRateLimit.check(ip);
  if (!result.allowed) {
    // レート制限違反をログに記録
    logRateLimitExceeded(req, `Global ${pathname}`, undefined).catch(console.error);
  }
  return result;
};

/**
 * 疑わしいリクエストの検出
 */
export const detectSuspiciousRequest = (req: NextRequest): SecurityCheckResult => {
  const userAgent = req.headers.get('user-agent') || '';
  const pathname = req.nextUrl.pathname;

  // 空のUser-Agentを拒否
  if (!userAgent.trim()) {
    return {
      allowed: false,
      reason: 'Missing User-Agent header'
    };
  }

  // 一般的なボットパターンを検出
  const botPatterns = [
    /crawler/i,
    /bot/i,
    /spider/i,
    /scraper/i
  ];

  const isSuspiciousBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  // 保護ルートへのボットアクセスを制限
  const protectedPaths = ['/dashboard', '/profile', '/admin', '/board'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isSuspiciousBot && isProtectedPath) {
    // 疑わしい活動をログに記録
    logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
      reason: 'Bot access to protected route',
      userAgent,
      protectedPath: pathname
    }, undefined).catch(console.error);
    
    return {
      allowed: false,
      reason: 'Bot access to protected route denied'
    };
  }

  return { allowed: true };
};

/**
 * CSRF保護（強化版）
 */
export const checkCSRF = (req: NextRequest): SecurityCheckResult => {
  // GET, HEAD, OPTIONS リクエストは除外
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) {
    return { allowed: true };
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  if (!host) {
    return {
      allowed: false,
      reason: 'Missing Host header'
    };
  }

  // Origin ヘッダーのチェック
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        // CSRF違反をログに記録
        logSecurityEvent(req, 'CSRF_VIOLATION', {
          reason: 'Origin header mismatch',
          origin,
          host,
          method: req.method
        }, undefined).catch(console.error);
        
        return {
          allowed: false,
          reason: 'Origin header mismatch'
        };
      }
    } catch {
      // CSRF違反をログに記録
      logSecurityEvent(req, 'CSRF_VIOLATION', {
        reason: 'Invalid Origin header',
        origin,
        host,
        method: req.method
      }, undefined).catch(console.error);
      
      return {
        allowed: false,
        reason: 'Invalid Origin header'
      };
    }
  }

  // Referer ヘッダーのチェック（Origin がない場合）
  if (!origin && referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        // CSRF違反をログに記録
        logSecurityEvent(req, 'CSRF_VIOLATION', {
          reason: 'Referer header mismatch',
          referer,
          host,
          method: req.method
        }, undefined).catch(console.error);
        
        return {
          allowed: false,
          reason: 'Referer header mismatch'
        };
      }
    } catch {
      return {
        allowed: false,
        reason: 'Invalid Referer header'
      };
    }
  }

  // どちらのヘッダーもない場合は拒否
  if (!origin && !referer) {
    return {
      allowed: false,
      reason: 'Missing Origin and Referer headers'
    };
  }

  return { allowed: true };
};

/**
 * 包括的なセキュリティチェック
 */
export const performSecurityChecks = (req: NextRequest): SecurityCheckResult => {
  // 1. レート制限チェック
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return rateLimitResult;
  }

  // 2. 疑わしいリクエストチェック
  const suspiciousResult = detectSuspiciousRequest(req);
  if (!suspiciousResult.allowed) {
    return suspiciousResult;
  }

  // 3. CSRF保護チェック
  const csrfResult = checkCSRF(req);
  if (!csrfResult.allowed) {
    return csrfResult;
  }

  return { allowed: true };
};

/**
 * 定期クリーンアップ（メモリリーク対策）
 * 本格運用時はcronジョブやRedisのTTL機能を使用
 */
setInterval(() => {
  globalRateLimit.cleanup();
  authRateLimit.cleanup();
  apiRateLimit.cleanup();
}, 5 * 60 * 1000); // 5分毎にクリーンアップ（頻度増加）