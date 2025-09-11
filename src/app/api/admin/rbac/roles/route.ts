import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { connectDB } from '@/lib/mongodb';
import Role from '@/models/Role';
import AdminUser from '@/models/AdminUser';
import { checkPermission, forbiddenResponse, unauthorizedResponse } from '@/middleware/rbac';

// GET: ロール一覧取得
export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse('No session found');
    }

    // ユーザーロール確認
    const userRole = (session.user as any).role;

    // admin, super_admin, moderatorの場合は権限チェックをスキップ
    if (['admin', 'super_admin', 'moderator'].includes(userRole)) {
      console.log(`✅ Allowing ${userRole} role to access roles API`);
    } else {
      // 権限チェック
      const permissionCheck = await checkPermission(request, 'admins.read');

      if (!permissionCheck.allowed) {
        return permissionCheck.reason?.includes('Unauthorized')
          ? unauthorizedResponse(permissionCheck.reason)
          : forbiddenResponse(permissionCheck.reason);
      }
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
    // セッション確認
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse('No session found');
    }

    // ユーザーロール確認
    const userRole = (session.user as any).role;

    // super_adminのみがロールを作成可能
    if (userRole !== 'super_admin') {
      return forbiddenResponse('Only super_admin can create roles');
    }

    const adminUser = session.user;

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
      createdBy: adminUser.id,
      lastModifiedBy: adminUser.id,
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
