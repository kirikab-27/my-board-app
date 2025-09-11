import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Permission from '@/models/Permission';
import { checkPermission, forbiddenResponse, unauthorizedResponse } from '@/middleware/rbac';

// GET: 権限一覧取得
export async function GET(request: NextRequest) {
  try {
    // 権限チェック
    const permissionCheck = await checkPermission(request, 'admins.read');

    // 開発環境での追加チェック
    if (!permissionCheck.allowed && process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Development mode: Overriding permission check for /api/admin/rbac/permissions'
      );
      // 開発環境では警告を出すが続行する
    } else if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const category = searchParams.get('category');
    const riskLevel = searchParams.get('riskLevel');
    const isActive = searchParams.get('active') !== 'false';

    // クエリ構築
    const query: any = { isActive };
    if (resource) query.resource = resource;
    if (category) query.category = category;
    if (riskLevel) query.riskLevel = riskLevel;

    const permissions = await Permission.find(query).sort({ resource: 1, action: 1 });

    // カテゴリー別にグループ化
    const groupedPermissions = permissions.reduce((acc: any, perm) => {
      const key = perm.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        _id: perm._id,
        name: perm.name,
        displayName: perm.displayName,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        conditions: perm.conditions,
        riskLevel: perm.riskLevel,
        requiresMFA: perm.requiresMFA,
        requiresApproval: perm.requiresApproval,
        isSystem: perm.isSystem,
      });
      return acc;
    }, {});

    return NextResponse.json({
      permissions,
      grouped: groupedPermissions,
      stats: {
        total: permissions.length,
        byRiskLevel: {
          critical: permissions.filter((p) => p.riskLevel === 'critical').length,
          high: permissions.filter((p) => p.riskLevel === 'high').length,
          medium: permissions.filter((p) => p.riskLevel === 'medium').length,
          low: permissions.filter((p) => p.riskLevel === 'low').length,
        },
        requiresMFA: permissions.filter((p) => p.requiresMFA).length,
        requiresApproval: permissions.filter((p) => p.requiresApproval).length,
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST: 新規権限作成またはデフォルト権限の初期化
export async function POST(request: NextRequest) {
  try {
    // super_adminのみが新規権限を作成可能
    const permissionCheck = await checkPermission(request, 'system.write');
    if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    const adminUser = permissionCheck.user;

    await connectDB();

    const body = await request.json();

    // 初期化リクエストの場合
    if (body.action === 'initialize') {
      // デフォルト権限の作成
      await Permission.createDefaultPermissions();
      const count = await Permission.countDocuments({ isSystem: true });

      return NextResponse.json({
        message: 'Default permissions initialized',
        count,
      });
    }

    // 通常の権限作成
    const {
      name,
      displayName,
      description,
      resource,
      action,
      conditions,
      category,
      riskLevel,
      requiresMFA,
      requiresApproval,
    } = body;

    // 権限名の検証
    if (!name.match(/^[a-z_]+\.[a-z_]+$/)) {
      return NextResponse.json(
        { error: 'Permission name must be in resource.action format' },
        { status: 400 }
      );
    }

    // 既存権限の確認
    const existing = await Permission.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: 'Permission already exists' }, { status: 400 });
    }

    // 新規権限作成
    const permission = new Permission({
      name,
      displayName,
      description,
      resource,
      action,
      conditions: conditions || {},
      category,
      riskLevel: riskLevel || 'low',
      requiresMFA: requiresMFA || false,
      requiresApproval: requiresApproval || false,
      isActive: true,
      isSystem: false,
      createdBy: adminUser._id,
      lastModifiedBy: adminUser._id,
    });

    await permission.save();

    return NextResponse.json(
      {
        message: 'Permission created successfully',
        permission: {
          _id: permission._id,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          riskLevel: permission.riskLevel,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}
