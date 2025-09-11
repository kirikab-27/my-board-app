import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Role from '@/models/Role';
import AdminUser from '@/models/AdminUser';
import { checkPermission, forbiddenResponse, unauthorizedResponse } from '@/middleware/rbac';

// パラメータの型定義
type Params = Promise<{ id: string }>;

// GET: ロール詳細取得
export async function GET(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;

    // 権限チェック
    const permissionCheck = await checkPermission(request, 'admins.read');
    if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // 全権限を取得
    const allPermissions = await role.getAllPermissions();

    // このロールを持つユーザー一覧
    const users = await AdminUser.find({
      adminRole: role.name,
      isActive: true,
    })
      .populate('userId', 'name email')
      .select('userId lastLoginAt')
      .limit(10);

    return NextResponse.json({
      role: {
        _id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        allPermissions,
        inheritFrom: role.inheritFrom,
        priority: role.priority,
        isSystem: role.isSystem,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
      users,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT: ロール更新
export async function PUT(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;

    // 権限チェック
    const permissionCheck = await checkPermission(request, 'admins.update');
    if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    const adminUser = permissionCheck.user;

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // システムロールは super_admin のみが編集可能
    if (role.isSystem && adminUser.adminRole !== 'super_admin') {
      return forbiddenResponse('Only super_admin can modify system roles');
    }

    const body = await request.json();
    const { displayName, description, permissions, inheritFrom, priority, isActive } = body;

    // 更新
    if (displayName !== undefined) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (inheritFrom !== undefined) role.inheritFrom = inheritFrom;
    if (priority !== undefined) role.priority = priority;
    if (isActive !== undefined) role.isActive = isActive;

    role.lastModifiedBy = adminUser._id;

    await role.save();

    // このロールを持つユーザーの権限キャッシュを更新
    await AdminUser.updateMany(
      { adminRole: role.name },
      { $set: { rolePermissions: role.permissions } }
    );

    return NextResponse.json({
      message: 'Role updated successfully',
      role: {
        _id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        inheritFrom: role.inheritFrom,
        priority: role.priority,
        isActive: role.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE: ロール削除（論理削除）
export async function DELETE(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;

    // 権限チェック
    const permissionCheck = await checkPermission(request, 'admins.delete');
    if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    const adminUser = permissionCheck.user;

    // super_admin のみが削除可能
    if (adminUser.adminRole !== 'super_admin') {
      return forbiddenResponse('Only super_admin can delete roles');
    }

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // システムロールは削除不可
    if (role.isSystem) {
      return forbiddenResponse('System roles cannot be deleted');
    }

    // このロールを持つアクティブユーザーの確認
    const activeUsers = await AdminUser.countDocuments({
      adminRole: role.name,
      isActive: true,
    });

    if (activeUsers > 0) {
      return NextResponse.json(
        { error: `Cannot delete role with ${activeUsers} active users` },
        { status: 400 }
      );
    }

    // 論理削除
    role.isActive = false;
    role.lastModifiedBy = adminUser._id;
    await role.save();

    return NextResponse.json({
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
