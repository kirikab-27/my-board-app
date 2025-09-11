import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { SecretsVault } from '@/lib/security/encryption/vault';

/**
 * 管理者向け秘密情報管理API
 * Issue #52: 環境変数・秘密鍵管理システム
 */

// 秘密情報管理インスタンス
const vault = new SecretsVault();

/**
 * GET /api/admin/secrets
 * 秘密情報の一覧取得・統計情報
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    await vault.initialize();

    // アクション別処理
    switch (action) {
      case 'stats':
        // 統計情報を取得
        const stats = await vault.getStatistics();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'log':
        // アクセスログを取得
        if (!key) {
          return NextResponse.json(
            { success: false, error: 'Key parameter required' },
            { status: 400 }
          );
        }
        const logs = await vault.getAccessLog(key);
        return NextResponse.json({
          success: true,
          data: logs,
        });

      case 'list':
        // 環境別の秘密情報リスト（値はマスク）
        const environment = searchParams.get('environment') || 'all';
        const secrets = await vault.getAllByEnvironment(environment);

        // 値をマスク
        const masked = Object.fromEntries(
          Object.entries(secrets).map(([k, v]) => [
            k,
            v.substring(0, 4) + '****' + v.substring(v.length - 4),
          ])
        );

        return NextResponse.json({
          success: true,
          data: masked,
        });

      default:
        // デフォルト: 統計情報
        const defaultStats = await vault.getStatistics();
        return NextResponse.json({
          success: true,
          data: defaultStats,
        });
    }
  } catch (error) {
    console.error('❌ 秘密情報API エラー:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/secrets
 * 秘密情報の作成・保存
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value, environment, category, description } = body;

    // バリデーション
    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // IPアドレス取得
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    await vault.initialize();

    // 秘密情報を保存
    await vault.store(key, value, {
      environment,
      category,
      description,
      userId: session.user.email || undefined,
      ipAddress,
      encrypt: true,
    });

    console.log(`✅ 秘密情報を保存しました: ${key} (by ${session.user.email})`);

    return NextResponse.json({
      success: true,
      message: 'Secret stored successfully',
    });
  } catch (error) {
    console.error('❌ 秘密情報保存エラー:', error);
    return NextResponse.json({ success: false, error: 'Failed to store secret' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/secrets
 * 秘密情報の更新・ローテーション
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value, action } = body;

    // バリデーション
    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    // IPアドレス取得
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    await vault.initialize();

    if (action === 'rotate') {
      // ローテーション
      if (!value) {
        return NextResponse.json(
          { success: false, error: 'New value is required for rotation' },
          { status: 400 }
        );
      }

      await vault.rotate(key, value, {
        userId: session.user.email || undefined,
        ipAddress,
      });

      console.log(`🔄 秘密情報をローテーションしました: ${key} (by ${session.user.email})`);
    } else {
      // 通常の更新
      if (!value) {
        return NextResponse.json(
          { success: false, error: 'Value is required for update' },
          { status: 400 }
        );
      }

      await vault.update(key, value, {
        userId: session.user.email || undefined,
        ipAddress,
        encrypt: true,
      });

      console.log(`✅ 秘密情報を更新しました: ${key} (by ${session.user.email})`);
    }

    return NextResponse.json({
      success: true,
      message: action === 'rotate' ? 'Secret rotated successfully' : 'Secret updated successfully',
    });
  } catch (error) {
    console.error('❌ 秘密情報更新エラー:', error);
    return NextResponse.json({ success: false, error: 'Failed to update secret' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/secrets
 * 秘密情報の削除
 */
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // スーパー管理者権限チェック（削除は最高権限のみ）
    const userRole = (session.user as any).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can delete secrets' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // バリデーション
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    // IPアドレス取得
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    await vault.initialize();

    // 削除実行
    await vault.delete(key, {
      userId: session.user.email || undefined,
      ipAddress,
    });

    console.log(`🗑️ 秘密情報を削除しました: ${key} (by ${session.user.email})`);

    return NextResponse.json({
      success: true,
      message: 'Secret deleted successfully',
    });
  } catch (error) {
    console.error('❌ 秘密情報削除エラー:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete secret' }, { status: 500 });
  }
}
