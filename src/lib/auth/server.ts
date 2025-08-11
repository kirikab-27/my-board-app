import { getServerSession } from 'next-auth/next';
import { authOptions } from './nextauth';
import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';

/**
 * サーバーサイド認証情報取得（App Router対応）
 */
export async function getServerAuth(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('❌ Failed to get server session:', error);
    return null;
  }
}

/**
 * API Route用認証確認
 * @param req - NextRequest
 * @returns Session | null
 */
export async function getApiAuth(_req: NextRequest): Promise<Session | null> {
  try {
    // Next.js 15のApp Router環境でのAPI認証
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('❌ Failed to get API session:', error);
    return null;
  }
}

/**
 * 認証必須チェック（未認証時はエラーレスポンス）
 */
export async function requireAuth(): Promise<{ session: Session; user: NonNullable<Session['user']> }> {
  const session = await getServerAuth();
  
  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED');
  }

  return { session, user: session.user };
}

/**
 * API Route用認証必須チェック
 */
export async function requireApiAuth(req: NextRequest): Promise<{ session: Session; user: NonNullable<Session['user']> }> {
  const session = await getApiAuth(req);
  
  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED');
  }

  return { session, user: session.user };
}

/**
 * ユーザー権限チェック
 * @param userId - 確認対象のユーザーID
 * @param targetUserId - 対象リソースのユーザーID
 * @returns boolean
 */
export function checkUserPermission(userId: string, targetUserId: string): boolean {
  return userId === targetUserId;
}

/**
 * API用統一エラーレスポンス
 */
export function createUnauthorizedResponse(message: string = '認証が必要です') {
  return Response.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

/**
 * API用統一権限不足レスポンス
 */
export function createForbiddenResponse(message: string = 'この操作を実行する権限がありません') {
  return Response.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}

/**
 * API用統一内部エラーレスポンス
 */
export function createServerErrorResponse(message: string = '内部サーバーエラーが発生しました') {
  return Response.json(
    { error: message, code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  );
}