/**
 * Content Security Policy (CSP) ヘッダー設定
 * XSS攻撃の多層防御を提供
 */

import crypto from 'crypto';

/**
 * 本番環境用のCSPヘッダー（厳格）
 */
const productionCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
  connect-src 'self' 
    https://api.github.com 
    https://accounts.google.com 
    https://oauth2.googleapis.com
    https://www.googleapis.com;
`.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * 開発環境用のCSPヘッダー（緩い）
 */
const developmentCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' 
    ws://localhost:*
    ws://127.0.0.1:*
    http://localhost:*
    http://127.0.0.1:*
    https://api.github.com 
    https://accounts.google.com 
    https://oauth2.googleapis.com
    https://www.googleapis.com;
`.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * 包括的なセキュリティヘッダー
 */
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': process.env.NODE_ENV === 'production' 
    ? productionCSP 
    : developmentCSP,

  // XSS保護
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',

  // HTTPS強制（本番環境のみ）
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  }),

  // リファラー制御
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // 権限制御
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // DNS prefetchとpreconnectの制御
  'X-DNS-Prefetch-Control': 'off',
};

/**
 * CSPのnonce生成（動的CSP用）
 */
export function generateCSPNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

/**
 * 動的CSPヘッダー生成（nonce対応）
 */
export function generateCSPWithNonce(nonce: string): string {
  const baseCSP = process.env.NODE_ENV === 'production' ? productionCSP : developmentCSP;
  
  // script-srcにnonceを追加
  return baseCSP.replace(
    "script-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`
  );
}

/**
 * CSP違反レポート処理用の設定
 */
export const cspReportingHeaders = {
  'Content-Security-Policy-Report-Only': `
    ${process.env.NODE_ENV === 'production' ? productionCSP : developmentCSP};
    report-uri /api/security/csp-report;
    report-to csp-endpoint;
  `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
  
  'Report-To': JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400,
    endpoints: [{ url: '/api/security/csp-report' }]
  }),
};

/**
 * 特定のページ用カスタムCSP
 */
export const pageSpecificCSP = {
  // OAuth認証ページ用（外部リダイレクト許可）
  auth: `
    default-src 'self';
    script-src 'self' https://accounts.google.com https://github.com;
    style-src 'self' 'unsafe-inline' https://accounts.google.com https://github.githubassets.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob: https://avatars.githubusercontent.com;
    connect-src 'self' https://api.github.com https://accounts.google.com;
    frame-src https://accounts.google.com https://github.com;
    form-action 'self' https://github.com https://accounts.google.com;
  `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),

  // 管理ダッシュボード用（Chart.js許可）
  admin: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob:;
    connect-src 'self';
  `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
};

/**
 * CSP違反の検出とログ記録
 */
export interface CSPViolation {
  'document-uri': string;
  'violated-directive': string;
  'blocked-uri': string;
  'source-file': string;
  'line-number': number;
  'column-number': number;
  'status-code': number;
}

/**
 * CSP違反レポートの処理
 */
export function processCSPViolation(violation: CSPViolation): void {
  // 開発環境では詳細ログ
  if (process.env.NODE_ENV === 'development') {
    console.warn('🛡️ CSP違反を検出:', {
      directive: violation['violated-directive'],
      blocked: violation['blocked-uri'],
      source: violation['source-file'],
      line: violation['line-number']
    });
  }

  // 本番環境では監視システムに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Sentryやその他の監視システムに送信
    console.error('[CSP VIOLATION]', violation);
  }
}