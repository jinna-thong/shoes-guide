/**
 * Error Log Cleanup Endpoint
 *
 * POST /api/errors/cleanup
 *
 * Cleans up old error logs based on retention policy (30 days default).
 * Should be called by a scheduled Cron Trigger in Cloudflare Pages.
 *
 * This endpoint should be protected by:
 * - Cloudflare Access
 * - API key authentication
 * - IP allowlist
 *
 * Returns:
 * {
 *   success: boolean,
 *   deleted_count: number,
 *   retention_days: number
 * }
 */

import { ErrorLogger } from '../../_lib/error-logger';

interface Env {
  DB: D1Database;
  ERROR_CLEANUP_API_KEY?: string; // Secret for authentication
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Authentication check (if API key is configured)
    if (context.env.ERROR_CLEANUP_API_KEY) {
      const authHeader = context.request.headers.get('Authorization');
      const expectedAuth = `Bearer ${context.env.ERROR_CLEANUP_API_KEY}`;

      if (authHeader !== expectedAuth) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Create error logger with 30-day retention
    const logger = new ErrorLogger(context.env.DB, 30);

    // Clean up old logs
    const deletedCount = await logger.cleanupOldLogs();

    return new Response(JSON.stringify({
      success: true,
      deleted_count: deletedCount,
      retention_days: 30,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error cleanup endpoint failed:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
