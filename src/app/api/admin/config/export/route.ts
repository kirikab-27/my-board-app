import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { configService } from '@/services/configService';
import { connectDB } from '@/lib/mongodb';
import { Environment } from '@/models/SystemConfig';

// GET: 設定のエクスポート
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const environment = (searchParams.get('environment') as Environment) || 'development';

    const exportData = await configService.export(environment);

    // ダウンロード用のレスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set(
      'Content-Disposition',
      `attachment; filename="config-${environment}-${new Date().toISOString().split('T')[0]}.json"`
    );

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error exporting config:', error);
    return NextResponse.json({ error: 'Failed to export configuration' }, { status: 500 });
  }
}

// POST: 設定のインポート
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { data, environment = 'development' } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const result = await configService.import(data, environment, session.user?.email || 'system');

    return NextResponse.json({
      success: true,
      imported: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error importing config:', error);
    return NextResponse.json({ error: 'Failed to import configuration' }, { status: 500 });
  }
}
