import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { configService } from '@/services/configService';
import { connectDB } from '@/lib/mongodb';
import { Environment } from '@/models/SystemConfig';

// GET: 環境間の差分取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const env1 = (searchParams.get('env1') as Environment) || 'development';
    const env2 = (searchParams.get('env2') as Environment) || 'production';

    if (env1 === env2) {
      return NextResponse.json(
        { error: 'Please select different environments to compare' },
        { status: 400 }
      );
    }

    const differences = await configService.diff(env1, env2);

    // 差分をカテゴライズ
    const categorized = {
      missingInEnv1: differences.filter((d) => d.difference === 'missing_in_env1'),
      missingInEnv2: differences.filter((d) => d.difference === 'missing_in_env2'),
      differentValues: differences.filter((d) => d.difference === 'different_value'),
      same: differences.filter((d) => d.difference === 'same'),
    };

    return NextResponse.json({
      env1,
      env2,
      summary: {
        total: differences.length,
        missingInEnv1: categorized.missingInEnv1.length,
        missingInEnv2: categorized.missingInEnv2.length,
        differentValues: categorized.differentValues.length,
        same: categorized.same.length,
      },
      differences: categorized,
    });
  } catch (error) {
    console.error('Error comparing configurations:', error);
    return NextResponse.json({ error: 'Failed to compare configurations' }, { status: 500 });
  }
}
