import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { configService } from '@/services/configService';
import { ConfigHistory } from '@/models/SystemConfig';
import { connectDB } from '@/lib/mongodb';
import { Environment } from '@/models/SystemConfig';

// GET: 設定の履歴取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const environment = (searchParams.get('environment') as Environment) || 'development';
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};
    if (key) query.key = key;
    if (environment) query.environment = environment;

    const history = await ConfigHistory.find(query).sort({ timestamp: -1 }).limit(limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching config history:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration history' }, { status: 500 });
  }
}

// POST: 設定のロールバック
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { key, environment, version } = body;

    if (!key || !environment || !version) {
      return NextResponse.json(
        { error: 'Key, environment, and version are required' },
        { status: 400 }
      );
    }

    const config = await configService.rollback(
      key,
      environment,
      version,
      session.user?.email || 'system'
    );

    if (!config) {
      return NextResponse.json(
        { error: 'Failed to rollback. Version not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        key: config.key,
        value: config.isSecret ? '[ENCRYPTED]' : config.value,
        description: config.description,
        category: config.category,
        version: config.version,
      },
      message: `Configuration ${key} rolled back to version ${version}`,
    });
  } catch (error) {
    console.error('Error rolling back config:', error);
    return NextResponse.json({ error: 'Failed to rollback configuration' }, { status: 500 });
  }
}
