/**
 * Status Endpoint for shoes.guide Monitoring
 *
 * GET /api/status
 *
 * Provides detailed metrics for monitoring dashboards:
 * - Database statistics
 * - Content counts
 * - Performance metrics
 */

interface Env {
  DB: D1Database;
}

interface DatabaseStats {
  products_count: number;
  brands_count: number;
  reviews_count: number;
  comments_count: number;
}

interface StatusResponse {
  site: string;
  status: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  uptime_check: boolean;
  database: {
    status: 'connected' | 'error';
    latency_ms: number;
    stats?: DatabaseStats;
  };
  cache: {
    edge_location: string;
  };
  build: {
    version: string;
    timestamp: string;
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  let dbStatus: 'connected' | 'error' = 'connected';
  let dbLatency = 0;
  let dbStats: DatabaseStats | undefined;
  let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';

  // Database health and stats
  try {
    const dbStart = Date.now();

    // Run queries in parallel for efficiency
    const [
      productsResult,
      brandsResult,
      reviewsResult,
      commentsResult
    ] = await Promise.all([
      context.env.DB.prepare('SELECT COUNT(*) as count FROM products').first<{ count: number }>(),
      context.env.DB.prepare('SELECT COUNT(DISTINCT brand) as count FROM products').first<{ count: number }>(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM reviews').first<{ count: number }>().catch(() => ({ count: 0 })),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM comments').first<{ count: number }>().catch(() => ({ count: 0 }))
    ]);

    dbLatency = Date.now() - dbStart;

    dbStats = {
      products_count: productsResult?.count || 0,
      brands_count: brandsResult?.count || 0,
      reviews_count: reviewsResult?.count || 0,
      comments_count: commentsResult?.count || 0
    };
  } catch (error) {
    dbStatus = 'error';
    dbLatency = Date.now() - startTime;
    overallStatus = 'degraded';
  }

  // Get edge location from CF headers
  const cfRay = context.request.headers.get('cf-ray') || 'unknown';
  const edgeLocation = cfRay.split('-').pop() || 'unknown';

  const response: StatusResponse = {
    site: 'shoes.guide',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime_check: true,
    database: {
      status: dbStatus,
      latency_ms: dbLatency,
      ...(dbStats && { stats: dbStats })
    },
    cache: {
      edge_location: edgeLocation
    },
    build: {
      version: '1.0.0',
      timestamp: '2026-01-16T00:00:00Z'
    }
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: overallStatus === 'operational' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
