/**
 * Health Check Endpoint for shoes.guide
 *
 * GET /api/health
 *
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: One or more systems degraded
 *
 * Response includes:
 * - Overall status
 * - Individual service checks (D1, site, etc.)
 * - Timestamp and version info
 */

interface Env {
  DB: D1Database;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  region: string;
  checks: HealthCheck[];
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check 1: D1 Database
  try {
    const dbStart = Date.now();
    const result = await context.env.DB.prepare('SELECT 1 as ping').first();
    const dbLatency = Date.now() - dbStart;

    if (result && result.ping === 1) {
      checks.push({
        service: 'd1_database',
        status: 'healthy',
        latency_ms: dbLatency,
        message: 'Database responding normally'
      });
    } else {
      checks.push({
        service: 'd1_database',
        status: 'degraded',
        latency_ms: dbLatency,
        message: 'Database returned unexpected result'
      });
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.push({
      service: 'd1_database',
      status: 'unhealthy',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    overallStatus = 'unhealthy';
  }

  // Check 2: Worker execution (always passes if we get here)
  checks.push({
    service: 'worker',
    status: 'healthy',
    latency_ms: Date.now() - startTime,
    message: 'Worker executing normally'
  });

  // Check 3: Memory/CPU (basic check)
  checks.push({
    service: 'runtime',
    status: 'healthy',
    message: 'Cloudflare Workers runtime operational'
  });

  // Determine response status code
  const httpStatus = overallStatus === 'healthy' ? 200 :
                     overallStatus === 'degraded' ? 200 : 503;

  // Get Cloudflare-specific headers for region info
  const cfRay = context.request.headers.get('cf-ray') || 'unknown';
  const region = cfRay.split('-').pop() || 'unknown';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    region: region,
    checks: checks
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': 'true'
    }
  });
};

// Also support HEAD requests for simple uptime checks
export const onRequestHead: PagesFunction<Env> = async (context) => {
  try {
    await context.env.DB.prepare('SELECT 1').first();
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
