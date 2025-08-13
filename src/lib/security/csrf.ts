/**
 * CSRF (Cross-Site Request Forgery) 対策
 * トークンベース検証とSameSite Cookie設定
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * CSRFトークンの有効期限（ミリ秒）
 */
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24時間

/**
 * CSRFトークン情報
 */
interface CSRFTokenData {
  token: string;
  expires: number;
  sessionId?: string;
}

/**
 * インメモリCSRFトークンストア（本番では Redis や DB を推奨）
 */
const csrfTokenStore = new Map<string, CSRFTokenData>();

/**
 * 定期的なトークンクリーンアップ
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of csrfTokenStore.entries()) {
    if (now > data.expires) {
      csrfTokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1時間毎

/**
 * CSRFトークンの生成
 */
export function generateCSRFToken(sessionId?: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  
  csrfTokenStore.set(token, {
    token,
    expires,
    sessionId
  });
  
  return token;
}

/**
 * CSRFトークンの検証
 */
export function verifyCSRFToken(token: string, sessionId?: string): boolean {
  if (!token) return false;
  
  const tokenData = csrfTokenStore.get(token);
  if (!tokenData) return false;
  
  // 有効期限チェック
  if (Date.now() > tokenData.expires) {
    csrfTokenStore.delete(token);
    return false;
  }
  
  // セッションIDチェック（提供されている場合）
  if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
    return false;
  }
  
  return true;
}

/**
 * 使用済みCSRFトークンの削除
 */
export function revokeCSRFToken(token: string): void {
  csrfTokenStore.delete(token);
}

/**
 * セッション用の全CSRFトークン削除
 */
export function revokeAllCSRFTokensForSession(sessionId: string): void {
  for (const [token, data] of csrfTokenStore.entries()) {
    if (data.sessionId === sessionId) {
      csrfTokenStore.delete(token);
    }
  }
}

/**
 * リクエストからCSRFトークンを抽出
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // ヘッダーから取得（優先）
  let token = request.headers.get('X-CSRF-Token') || 
              request.headers.get('X-Requested-With');
  
  if (token) return token;
  
  // フォームデータから取得（フォールバック）
  try {
    const url = new URL(request.url);
    token = url.searchParams.get('csrf_token');
    if (token) return token;
  } catch {
    // URL解析エラーは無視
  }
  
  return null;
}

/**
 * Origin/Referer ヘッダーのチェック（追加の CSRF 保護）
 */
export function verifyOriginHeader(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (!host) return false;
  
  // Origin ヘッダーのチェック
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        console.warn('🚫 Origin header mismatch:', { origin: originHost, host });
        return false;
      }
    } catch {
      return false;
    }
  }
  
  // Referer ヘッダーのチェック（Origin がない場合）
  if (!origin && referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        console.warn('🚫 Referer header mismatch:', { referer: refererHost, host });
        return false;
      }
    } catch {
      return false;
    }
  }
  
  // どちらのヘッダーもない場合は拒否
  if (!origin && !referer) {
    console.warn('🚫 Missing Origin and Referer headers');
    return false;
  }
  
  return true;
}

/**
 * 包括的な CSRF チェック
 */
export function performCSRFCheck(request: NextRequest, sessionId?: string): {
  valid: boolean;
  reason?: string;
} {
  // GET, HEAD, OPTIONS リクエストは除外
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (safeMethod) {
    return { valid: true };
  }
  
  // Content-Type チェック（JSON API の場合）
  const contentType = request.headers.get('content-type') || '';
  const isJsonRequest = contentType.includes('application/json');
  
  // 1. Origin/Referer ヘッダーチェック
  if (!verifyOriginHeader(request)) {
    return { 
      valid: false, 
      reason: 'Origin/Referer header validation failed' 
    };
  }
  
  // 2. CSRF トークンチェック（JSON リクエストの場合）
  if (isJsonRequest) {
    const token = extractCSRFToken(request);
    if (!token) {
      return { 
        valid: false, 
        reason: 'CSRF token missing' 
      };
    }
    
    if (!verifyCSRFToken(token, sessionId)) {
      return { 
        valid: false, 
        reason: 'Invalid CSRF token' 
      };
    }
  }
  
  return { valid: true };
}

/**
 * CSRF トークンをレスポンスクッキーに設定
 */
export function setCSRFCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return [
    `csrf-token=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(CSRF_TOKEN_EXPIRY / 1000)}`,
    'Path=/',
    ...(isProduction ? ['Secure'] : [])
  ].join('; ');
}

/**
 * CSRF保護のためのミドルウェア関数
 */
export function createCSRFMiddleware() {
  return (request: NextRequest, sessionId?: string) => {
    const result = performCSRFCheck(request, sessionId);
    
    if (!result.valid) {
      console.warn('🛡️ CSRF攻撃を検出:', {
        method: request.method,
        url: request.url,
        reason: result.reason,
        ip: request.ip,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
    }
    
    return result;
  };
}

/**
 * 開発用: CSRF トークン統計
 */
export function getCSRFStatistics(): {
  totalTokens: number;
  expiredTokens: number;
  validTokens: number;
} {
  const now = Date.now();
  let expiredTokens = 0;
  let validTokens = 0;
  
  for (const data of csrfTokenStore.values()) {
    if (now > data.expires) {
      expiredTokens++;
    } else {
      validTokens++;
    }
  }
  
  return {
    totalTokens: csrfTokenStore.size,
    expiredTokens,
    validTokens
  };
}