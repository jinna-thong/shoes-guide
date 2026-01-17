/**
 * Error Statistics & Monitoring Endpoint
 *
 * GET /api/errors/stats?minutes=60
 *
 * Provides error statistics and aggregation for monitoring dashboards.
 * Used for:
 * - Error rate monitoring
 * - Alert threshold checking
 * - Dashboard visualizations
 * - Debugging recent issues
 *
 * Query Parameters:
 * - minutes: Time window for statistics (default: 60, max: 1440)
 *
 * Returns:
 * {
 *   total_errors: number,
 *   error_rate: number,  // errors per minute
 *   critical_count: number,
 *   error_count: number,
 *   warn_count: number,
 *   alert_threshold_exceeded: boolean,
 *   recent_errors: ErrorLogEntry[]
 * }
 */

import { ErrorLogger, type ErrorStats } from '../../_lib/error-logger';

interface Env {
  DB: D1Database;
}

interface ExtendedErrorStats extends ErrorStats {
  alert_threshold_exceeded: boolean;
  window_minutes: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Parse query parameters
    const url = new URL(context.request.url);
    const minutesParam = url.searchParams.get('minutes');
    const minutes = minutesParam ? Math.min(parseInt(minutesParam, 10), 1440) : 60;

    // Validate minutes parameter
    if (isNaN(minutes) || minutes < 1) {
      return new Response(JSON.stringify({
        error: 'Invalid minutes parameter. Must be a positive integer.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create error logger
    const logger = new ErrorLogger(context.env.DB);

    // Get error statistics
    const stats = await logger.getErrorStats(minutes);

    // Check if error rate exceeds alert threshold (1% or 1 error per minute)
    const alertThresholdExceeded = await logger.checkErrorRateThreshold(1.0, minutes);

    // Build response
    const response: ExtendedErrorStats = {
      ...stats,
      alert_threshold_exceeded: alertThresholdExceeded,
      window_minutes: minutes
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error stats endpoint failed:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
