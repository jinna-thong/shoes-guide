/**
 * Error Logging API Endpoint
 *
 * POST /api/error-log
 *
 * Receives error reports from:
 * - Client-side JavaScript (React Error Boundaries, global error handlers)
 * - Server-side Workers (internal errors)
 * - External services (via webhooks)
 *
 * Request Body:
 * {
 *   level: 'critical' | 'error' | 'warn' | 'info',
 *   service: 'frontend' | 'worker',
 *   message: string,
 *   stack?: string,
 *   url: string,
 *   userAgent?: string,
 *   additionalData?: object
 * }
 *
 * Returns:
 * - 201 Created: Error logged successfully
 * - 400 Bad Request: Invalid request body
 * - 500 Internal Server Error: Logging failed
 */

import { ErrorLogger, type ErrorLevel, type ErrorService, extractErrorContext } from '../_lib/error-logger';

interface Env {
  DB: D1Database;
}

interface ClientErrorReport {
  level: ErrorLevel;
  service: ErrorService;
  message: string;
  stack?: string;
  url: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse request body
    const body = await context.request.json() as ClientErrorReport;

    // Validate required fields
    if (!body.level || !body.service || !body.message || !body.url) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: level, service, message, url'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate level
    const validLevels: ErrorLevel[] = ['critical', 'error', 'warn', 'info'];
    if (!validLevels.includes(body.level)) {
      return new Response(JSON.stringify({
        error: `Invalid level. Must be one of: ${validLevels.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate service
    const validServices: ErrorService[] = ['worker', 'frontend', 'd1', 'r2', 'external_api'];
    if (!validServices.includes(body.service)) {
      return new Response(JSON.stringify({
        error: `Invalid service. Must be one of: ${validServices.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract context from request
    const requestContext = extractErrorContext(context.request);

    // Create error logger
    const logger = new ErrorLogger(context.env.DB);

    // Create error object from message
    const error = body.stack
      ? Object.assign(new Error(body.message), { stack: body.stack })
      : new Error(body.message);

    // Log the error
    await logger.logError(
      body.level,
      body.message,
      error,
      {
        ...requestContext,
        url: body.url,
        userAgent: body.userAgent || requestContext.userAgent,
        additionalData: body.additionalData
      },
      body.service
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Error logged successfully',
      request_id: requestContext.requestId
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow client-side logging
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    // Fallback error logging
    console.error('Error logging endpoint failed:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle CORS preflight requests
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
