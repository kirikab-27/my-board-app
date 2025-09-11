import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Role from '@/models/Role';
import AdminUser from '@/models/AdminUser';
import { checkPermission, forbiddenResponse, unauthorizedResponse } from '@/middleware/rbac';

// GET: ロール一覧取得
export async function GET(request: NextRequest) {
  try {
    // 権限チェック
    const permissionCheck = await checkPermission(request, 'admins.read');

    // 開発環境での追加チェック
    if (!permissionCheck.allowed && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Development mode: Overriding permission check for /api/admin/rbac/roles');
      // 開発環境では警告を出すが続行する
    } else if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active') !== 'false';

    const roles = await Role.find({ isActive }).sort({ priority: -1, name: 1 });

    // 各ロールの使用状況を取得
    const rolesWithStats = await Promise.all(
      roles.map(async (role) => {
        const userCount = await AdminUser.countDocuments({
          adminRole: role.name,
          isActive: true,
        });

        return {
          _id: role._id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          inheritFrom: role.inheritFrom,
          priority: role.priority,
          isSystem: role.isSystem,
          isActive: role.isActive,
          userCount,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        };
      })
    );

    return NextResponse.json(rolesWithStats);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST: 新規ロール作成
export async function POST(request: NextRequest) {
  try {
    // super_adminのみが新規ロールを作成可能
    const permissionCheck = await checkPermission(request, 'admins.create');
    if (!permissionCheck.allowed) {
      return permissionCheck.reason?.includes('Unauthorized')
        ? unauthorizedResponse(permissionCheck.reason)
        : forbiddenResponse(permissionCheck.reason);
    }

    const adminUser = permissionCheck.user;
    if (adminUser.adminRole !== 'super_admin') {
      return forbiddenResponse('Only super_admin can create roles');
    }

    await connectDB();

    const body = await request.json();
    const { name, displayName, description, permissions, inheritFrom, priority } = body;

    // 既存ロールの確認
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    // 新規ロール作成
    const role = new Role({
      name,
      displayName,
      description,
      permissions: permissions || [],
      inheritFrom,
      priority: priority || 50,
      isSystem: false,
      isActive: true,
      createdBy: adminUser._id,
      lastModifiedBy: adminUser._id,
    });

    await role.save();

    return NextResponse.json(
      {
        message: 'Role created successfully',
        role: {
          _id: role._id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          inheritFrom: role.inheritFrom,
          priority: role.priority,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
