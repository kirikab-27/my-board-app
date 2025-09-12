import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/**
 * Health Check Endpoint
 * Issue #62: Blue-Green・カナリアデプロイメント用ヘルスチェック
 */

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  deploymentId?: string;
  checks: {
    database: boolean;
    api: boolean;
    auth: boolean;
    storage?: boolean;
  };
  responseTime: {
    database: number;
    total: number;
  };
  errors: string[];
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const errors: string[] = [];
  let dbResponseTime = 0;

  // Check if this is from deployment health check
  const isDeploymentCheck = request.headers.get('X-Health-Check') === 'true';

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    deploymentId: process.env.DEPLOYMENT_ID || process.env.VERCEL_DEPLOYMENT_ID,
    checks: {
      database: false,
      api: true,
      auth: false,
      storage: false,
    },
    responseTime: {
      database: 0,
      total: 0,
    },
    errors,
  };

  try {
    // 1. Database check
    const dbStart = Date.now();
    try {
      await connectDB();

      // Perform a simple query to verify connection
      const mongoose = (await import('mongoose')).default;
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db?.admin().ping();
        result.checks.database = true;
      } else {
        throw new Error('Database connection not ready');
      }

      dbResponseTime = Date.now() - dbStart;
      result.responseTime.database = dbResponseTime;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database check failed';
      errors.push(`Database: ${errorMessage}`);
      result.checks.database = false;
    }

    // 2. Auth check (NextAuth)
    try {
      const authCheck = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3010'}/api/auth/providers`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      result.checks.auth = authCheck.ok;
      if (!authCheck.ok) {
        errors.push('Auth: NextAuth providers endpoint not responding');
      }
    } catch {
      errors.push('Auth: Failed to check authentication service');
      result.checks.auth = false;
    }

    // 3. Storage check (Cloudinary)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const cloudinaryCheck = await fetch(
          `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/test.jpg`,
          { method: 'HEAD' }
        );

        // 404 is expected for non-existent test image, but it means Cloudinary is accessible
        result.checks.storage = cloudinaryCheck.status === 404 || cloudinaryCheck.ok;
      } catch {
        errors.push('Storage: Cloudinary not accessible');
        result.checks.storage = false;
      }
    }

    // 4. Determine overall health status
    const criticalChecks = [result.checks.database, result.checks.api];
    const allCriticalHealthy = criticalChecks.every((check) => check === true);

    if (!allCriticalHealthy) {
      result.status = 'unhealthy';
    }

    // Calculate total response time
    result.responseTime.total = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = result.status === 'healthy' ? 200 : 503;

    // Add cache headers to prevent caching health checks
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    // Add deployment-specific headers
    if (isDeploymentCheck) {
      headers.set('X-Deployment-Id', result.deploymentId || 'unknown');
      headers.set('X-Environment', result.environment);
    }

    return new NextResponse(JSON.stringify(result, null, 2), {
      status: statusCode,
      headers,
    });
  } catch (error) {
    // Catastrophic failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: false,
          api: false,
          auth: false,
          storage: false,
        },
        responseTime: {
          database: dbResponseTime,
          total: Date.now() - startTime,
        },
        errors: [`Critical failure: ${errorMessage}`],
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Health-Check',
    },
  });
}
