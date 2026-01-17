/**
 * Error Logging Utility for shoes.guide Cloudflare Workers
 *
 * Provides structured error logging with categorization, stack traces,
 * and contextual information for production debugging.
 *
 * Usage:
 *   import { ErrorLogger } from './_lib/error-logger';
 *   const logger = new ErrorLogger(env.DB);
 *   await logger.logError('critical', 'Database connection failed', error, context);
 */

export type ErrorLevel = 'critical' | 'error' | 'warn' | 'info';
export type ErrorService = 'worker' | 'frontend' | 'd1' | 'r2' | 'external_api';

export interface ErrorContext {
  url: string;
  method: string;
  userAgent?: string;
  cfRay?: string;
  requestId: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorLogEntry {
  id?: string;
  timestamp: string;
  level: ErrorLevel;
  service: ErrorService;
  message: string;
  stack?: string;
  error_code?: string;
  context: ErrorContext;
  fingerprint: string; // For deduplication
  count?: number; // For aggregation
}

export interface ErrorStats {
  total_errors: number;
  error_rate: number; // errors per minute
  critical_count: number;
  error_count: number;
  warn_count: number;
  recent_errors: ErrorLogEntry[];
}

/**
 * Error Logger Class
 * Handles structured logging of errors to D1 database
 */
export class ErrorLogger {
  private db: D1Database;
  private retention_days: number;

  constructor(db: D1Database, retentionDays: number = 30) {
    this.db = db;
    this.retention_days = retentionDays;
  }

  /**
   * Log an error to D1 database
   */
  async logError(
    level: ErrorLevel,
    message: string,
    error: Error | unknown,
    context: Partial<ErrorContext>,
    service: ErrorService = 'worker'
  ): Promise<void> {
    try {
      const errorEntry: ErrorLogEntry = {
        timestamp: new Date().toISOString(),
        level,
        service,
        message,
        stack: error instanceof Error ? error.stack : undefined,
        error_code: error instanceof Error ? error.name : undefined,
        context: {
          url: context.url || 'unknown',
          method: context.method || 'unknown',
          userAgent: context.userAgent,
          cfRay: context.cfRay,
          requestId: context.requestId || this.generateRequestId(),
          userId: context.userId,
          additionalData: context.additionalData
        },
        fingerprint: this.generateFingerprint(message, error, context.url || '')
      };

      // Insert into D1 - use fingerprint for deduplication
      await this.db.prepare(`
        INSERT INTO error_logs (
          timestamp, level, service, message, stack, error_code,
          url, method, user_agent, cf_ray, request_id, user_id,
          additional_data, fingerprint
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(fingerprint, timestamp) DO UPDATE SET
          count = count + 1,
          last_seen = CURRENT_TIMESTAMP
      `).bind(
        errorEntry.timestamp,
        errorEntry.level,
        errorEntry.service,
        errorEntry.message,
        errorEntry.stack || null,
        errorEntry.error_code || null,
        errorEntry.context.url,
        errorEntry.context.method,
        errorEntry.context.userAgent || null,
        errorEntry.context.cfRay || null,
        errorEntry.context.requestId,
        errorEntry.context.userId || null,
        JSON.stringify(errorEntry.context.additionalData || {}),
        errorEntry.fingerprint
      ).run();

    } catch (logError) {
      // Fallback: Log to console if D1 logging fails
      console.error('Error logging failed:', logError);
      console.error('Original error:', { level, message, error, context });
    }
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStats(minutes: number = 60): Promise<ErrorStats> {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    // Get counts by level
    const counts = await this.db.prepare(`
      SELECT
        level,
        SUM(count) as total
      FROM error_logs
      WHERE timestamp >= ?
      GROUP BY level
    `).bind(since).all<{ level: ErrorLevel; total: number }>();

    const countMap = counts.results?.reduce((acc, row) => {
      acc[row.level] = row.total;
      return acc;
    }, {} as Record<ErrorLevel, number>) || {};

    const totalErrors = Object.values(countMap).reduce((sum, count) => sum + count, 0);
    const errorRate = totalErrors / minutes;

    // Get recent errors
    const recentErrors = await this.db.prepare(`
      SELECT
        id, timestamp, level, service, message, stack,
        url, method, request_id, fingerprint, count
      FROM error_logs
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
      LIMIT 50
    `).bind(since).all();

    const stats: ErrorStats = {
      total_errors: totalErrors,
      error_rate: Math.round(errorRate * 100) / 100,
      critical_count: countMap.critical || 0,
      error_count: countMap.error || 0,
      warn_count: countMap.warn || 0,
      recent_errors: (recentErrors.results || []).map(row => ({
        id: row.id as string,
        timestamp: row.timestamp as string,
        level: row.level as ErrorLevel,
        service: row.service as ErrorService,
        message: row.message as string,
        stack: row.stack as string | undefined,
        context: {
          url: row.url as string,
          method: row.method as string,
          requestId: row.request_id as string
        },
        fingerprint: row.fingerprint as string,
        count: row.count as number
      }))
    };

    return stats;
  }

  /**
   * Clean up old error logs based on retention policy
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.retention_days * 24 * 60 * 60 * 1000).toISOString();

    const result = await this.db.prepare(`
      DELETE FROM error_logs
      WHERE timestamp < ?
    `).bind(cutoffDate).run();

    return result.meta.changes;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate error fingerprint for deduplication
   * Same errors from same location get the same fingerprint
   */
  private generateFingerprint(message: string, error: unknown, url: string): string {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    const stackLine = error instanceof Error && error.stack
      ? error.stack.split('\n')[1]?.trim() || ''
      : '';

    // Create fingerprint from: error type + message + url + first stack line
    const fingerprintData = `${errorType}:${message}:${url}:${stackLine}`;

    // Simple hash function (in production, use crypto API)
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `fp_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if error rate exceeds threshold (for alerting)
   */
  async checkErrorRateThreshold(thresholdPercent: number = 1.0, windowMinutes: number = 5): Promise<boolean> {
    const stats = await this.getErrorStats(windowMinutes);

    // Calculate total requests (would need to track separately in production)
    // For now, use simple threshold on error rate
    return stats.error_rate > thresholdPercent;
  }
}

/**
 * Helper function to extract error context from Request
 */
export function extractErrorContext(request: Request): Partial<ErrorContext> {
  return {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    cfRay: request.headers.get('cf-ray') || undefined,
    requestId: request.headers.get('x-request-id') || crypto.randomUUID()
  };
}

/**
 * Helper function to determine error level from Error type
 */
export function determineErrorLevel(error: unknown): ErrorLevel {
  if (error instanceof Error) {
    const errorName = error.name.toLowerCase();

    // Critical: Database, auth, payment errors
    if (errorName.includes('database') ||
        errorName.includes('auth') ||
        errorName.includes('payment') ||
        errorName.includes('fatal')) {
      return 'critical';
    }

    // Warning: Validation, timeout errors
    if (errorName.includes('validation') ||
        errorName.includes('timeout') ||
        errorName.includes('abort')) {
      return 'warn';
    }
  }

  // Default to error level
  return 'error';
}
