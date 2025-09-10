import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { configService } from '@/services/configService';
import { SystemConfig } from '@/models/SystemConfig';
import { connectDB } from '@/lib/mongodb';
import { Environment } from '@/models/SystemConfig';

// GET: 設定の取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');
    const environment = (searchParams.get('environment') as Environment) || 'development';

    // 単一の設定を取得
    if (key) {
      const value = await configService.get(key, environment);
      if (value === null) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }

      const config = await SystemConfig.findOne({ key, environment, isActive: true });
      return NextResponse.json({
        key,
        value: config?.isSecret ? '[ENCRYPTED]' : value,
        description: config?.description,
        category: config?.category,
        dataType: config?.dataType,
        isSecret: config?.isSecret,
        isHotReloadable: config?.isHotReloadable,
        version: config?.version,
        lastModifiedBy: config?.lastModifiedBy,
        lastModifiedAt: config?.lastModifiedAt,
      });
    }

    // カテゴリー別に取得
    if (category) {
      const configs = await configService.getByCategory(category, environment);
      const result = configs.map((config) => ({
        key: config.key,
        value: config.isSecret ? '[ENCRYPTED]' : config.value,
        description: config.description,
        category: config.category,
        dataType: config.dataType,
        isSecret: config.isSecret,
        isHotReloadable: config.isHotReloadable,
        version: config.version,
        lastModifiedBy: config.lastModifiedBy,
        lastModifiedAt: config.lastModifiedAt,
      }));
      return NextResponse.json(result);
    }

    // 全設定を取得（秘密情報はマスク）
    const configs = await SystemConfig.find({ environment, isActive: true });
    const result = configs.map((config) => ({
      key: config.key,
      value: config.isSecret ? '[ENCRYPTED]' : config.value,
      description: config.description,
      category: config.category,
      dataType: config.dataType,
      isSecret: config.isSecret,
      isHotReloadable: config.isHotReloadable,
      version: config.version,
      lastModifiedBy: config.lastModifiedBy,
      lastModifiedAt: config.lastModifiedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

// POST: 設定の作成/更新
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      key,
      value,
      description,
      category,
      environment = 'development',
      dataType,
      isSecret,
      isHotReloadable,
      changeReason,
    } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // バリデーション
    const validation = await configService.validate(key, value, environment);
    if (!validation.valid && validation.errors.length > 0) {
      // 新規作成の場合はバリデーションエラーを無視
      const existingConfig = await SystemConfig.findOne({ key, environment });
      if (existingConfig) {
        return NextResponse.json(
          { error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        );
      }
    }

    // 設定を保存
    const config = await configService.set(key, value, {
      environment,
      changedBy: session.user?.email || 'system',
      changeReason,
      description,
      category,
      dataType,
      isSecret,
      isHotReloadable,
    });

    return NextResponse.json({
      success: true,
      config: {
        key: config.key,
        value: config.isSecret ? '[ENCRYPTED]' : config.value,
        description: config.description,
        category: config.category,
        dataType: config.dataType,
        isSecret: config.isSecret,
        isHotReloadable: config.isHotReloadable,
        version: config.version,
      },
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

// PUT: 設定の一括更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { configs, environment = 'development', changeReason } = body;

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: 'Configs must be an array' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const config of configs) {
      try {
        const updated = await configService.set(config.key, config.value, {
          environment,
          changedBy: session.user?.email || 'system',
          changeReason,
          description: config.description,
          category: config.category,
          dataType: config.dataType,
          isSecret: config.isSecret,
          isHotReloadable: config.isHotReloadable,
        });
        results.push({
          key: updated.key,
          success: true,
        });
      } catch (error) {
        errors.push({
          key: config.key,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error updating configs:', error);
    return NextResponse.json({ error: 'Failed to update configurations' }, { status: 500 });
  }
}

// DELETE: 設定の削除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const environment = (searchParams.get('environment') as Environment) || 'development';

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const deleted = await configService.delete(key, environment, session.user?.email || 'system');

    if (!deleted) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Configuration ${key} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
}
