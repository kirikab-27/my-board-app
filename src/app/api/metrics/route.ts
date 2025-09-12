import { NextRequest, NextResponse } from 'next/server';

/**
 * Metrics Endpoint for Canary Deployment
 * Issue #62: カナリアデプロイメント用メトリクス収集
 */

// In-memory metrics storage (in production, use Redis or similar)
const metricsStore = {
  requests: [] as Array<{
    timestamp: number;
    responseTime: number;
    statusCode: number;
    version: string;
    error?: boolean;
  }>,
  errors: [] as Array<{
    timestamp: number;
    message: string;
    version: string;
  }>,
};

// Clean up old metrics (keep last hour)
function cleanupMetrics() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  metricsStore.requests = metricsStore.requests.filter((r) => r.timestamp > oneHourAgo);
  metricsStore.errors = metricsStore.errors.filter((e) => e.timestamp > oneHourAgo);
}

export async function GET() {
  cleanupMetrics();

  const version = process.env.CANARY_VERSION || process.env.DEPLOYMENT_ID || 'baseline';
  const environment = process.env.NODE_ENV || 'development';

  // Calculate metrics for current version
  const versionRequests = metricsStore.requests.filter((r) => r.version === version);
  const baselineRequests = metricsStore.requests.filter((r) => r.version !== version);
  const versionErrors = metricsStore.errors.filter((e) => e.version === version);
  const baselineErrors = metricsStore.errors.filter((e) => e.version !== version);

  // Calculate error rates
  const calculateErrorRate = (requests: typeof metricsStore.requests) => {
    if (requests.length === 0) return 0;
    const errorCount = requests.filter((r) => r.error).length;
    return (errorCount / requests.length) * 100;
  };

  // Calculate average response times
  const calculateAvgResponseTime = (requests: typeof metricsStore.requests) => {
    if (requests.length === 0) return 0;
    const sum = requests.reduce((acc, r) => acc + r.responseTime, 0);
    return Math.round(sum / requests.length);
  };

  // Calculate percentiles
  const calculatePercentile = (requests: typeof metricsStore.requests, percentile: number) => {
    if (requests.length === 0) return 0;
    const sorted = [...requests].sort((a, b) => a.responseTime - b.responseTime);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index]?.responseTime || 0;
  };

  const metrics = {
    timestamp: new Date().toISOString(),
    environment,
    version,

    // Overall metrics
    totalRequests: metricsStore.requests.length,
    totalErrors: metricsStore.errors.length,
    errorRate: calculateErrorRate(metricsStore.requests),

    // Canary metrics
    canaryRequests: versionRequests.length,
    canaryErrors: versionErrors.length,
    canaryErrorRate: calculateErrorRate(versionRequests),
    canaryResponseTime: calculateAvgResponseTime(versionRequests),
    canaryP50: calculatePercentile(versionRequests, 50),
    canaryP95: calculatePercentile(versionRequests, 95),
    canaryP99: calculatePercentile(versionRequests, 99),

    // Baseline metrics
    baselineRequests: baselineRequests.length,
    baselineErrors: baselineErrors.length,
    baselineErrorRate: calculateErrorRate(baselineRequests),
    baselineResponseTime: calculateAvgResponseTime(baselineRequests),
    baselineP50: calculatePercentile(baselineRequests, 50),
    baselineP95: calculatePercentile(baselineRequests, 95),
    baselineP99: calculatePercentile(baselineRequests, 99),

    // System metrics
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),

    // Time windows
    lastHour: {
      requests: metricsStore.requests.length,
      errors: metricsStore.errors.length,
      errorRate: calculateErrorRate(metricsStore.requests),
    },
    last5Minutes: {
      requests: metricsStore.requests.filter((r) => r.timestamp > Date.now() - 5 * 60 * 1000)
        .length,
      errors: metricsStore.errors.filter((e) => e.timestamp > Date.now() - 5 * 60 * 1000).length,
    },

    // Recent errors (last 10)
    recentErrors: metricsStore.errors.slice(-10).map((e) => ({
      timestamp: new Date(e.timestamp).toISOString(),
      message: e.message,
      version: e.version,
    })),
  };

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

// POST method to record metrics (called by middleware or application)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Record request metric
    if (data.type === 'request') {
      metricsStore.requests.push({
        timestamp: Date.now(),
        responseTime: data.responseTime || 0,
        statusCode: data.statusCode || 200,
        version: data.version || 'baseline',
        error: data.statusCode >= 400,
      });
    }

    // Record error
    if (data.type === 'error') {
      metricsStore.errors.push({
        timestamp: Date.now(),
        message: data.message || 'Unknown error',
        version: data.version || 'baseline',
      });
    }

    // Clean up old metrics periodically
    if (Math.random() < 0.1) {
      // 10% chance to cleanup
      cleanupMetrics();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 400 });
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
