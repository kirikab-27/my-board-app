import { NextRequest } from 'next/server';

/**
 * クライアントのIPアドレスを取得する
 * @param request NextRequest オブジェクト
 * @returns IPアドレス文字列
 */
export function getClientIP(request: NextRequest): string {
  // プロキシ経由の場合のヘッダーをチェック
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For は複数のIPがカンマ区切りで入ることがあるので、最初のものを使用
    return forwarded.split(',')[0].trim();
  }

  // Cloudflareなどのヘッダー
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // その他のプロキシヘッダー
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // 開発環境での接続情報（fallback）
  const xForwardedHost = request.headers.get('x-forwarded-host');
  if (xForwardedHost) {
    return xForwardedHost;
  }

  // デフォルト（開発環境やローカル接続）
  return '127.0.0.1';
}