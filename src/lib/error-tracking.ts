/**
 * Client-Side Error Tracking Utility
 *
 * Provides error logging from browser to Cloudflare Workers error log endpoint.
 * Automatically captures:
 * - Unhandled errors
 * - Unhandled promise rejections
 * - React Error Boundary errors
 *
 * Usage:
 *   import { initErrorTracking, logError } from '@/lib/error-tracking';
 *
 *   // Initialize on app load
 *   initErrorTracking();
 *
 *   // Manual error logging
 *   logError('error', 'Something went wrong', error, { userId: '123' });
 */

export type ErrorLevel = 'critical' | 'error' | 'warn' | 'info';

interface ErrorLogPayload {
  level: ErrorLevel;
  service: 'frontend';
  message: string;
  stack?: string;
  url: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

/**
 * Log error to Cloudflare Workers endpoint
 */
export async function logError(
  level: ErrorLevel,
  message: string,
  error?: Error | unknown,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    const payload: ErrorLogPayload = {
      level,
      service: 'frontend',
      message,
      stack: error instanceof Error ? error.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData
    };

    // Send to error logging endpoint
    await fetch('/api/error-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // Don't block user experience on logging errors
      keepalive: true
    }).catch(err => {
      // Fallback: log to console if API call fails
      console.error('Failed to log error to server:', err);
      console.error('Original error:', { level, message, error });
    });
  } catch (loggingError) {
    // Silent fail - don't break app if error logging fails
    console.error('Error tracking failed:', loggingError);
  }
}

/**
 * Initialize global error tracking
 * Call this in your main app entry point
 */
export function initErrorTracking(): void {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    logError(
      'error',
      event.message || 'Unhandled error',
      event.error,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      'error',
      'Unhandled promise rejection',
      event.reason,
      {
        promise: String(event.promise)
      }
    );
  });

  // Track console errors (optional - can be noisy)
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    // Call original console.error
    originalConsoleError.apply(console, args);

    // Log to server if it's an Error object
    if (args[0] instanceof Error) {
      logError('error', args[0].message, args[0]);
    }
  };
}

/**
 * Create error tracking context for component trees
 * Returns cleanup function
 */
export function trackComponentErrors(componentName: string): () => void {
  const handler = (event: ErrorEvent) => {
    logError(
      'error',
      `Error in ${componentName}`,
      event.error,
      { component: componentName }
    );
  };

  window.addEventListener('error', handler);

  return () => {
    window.removeEventListener('error', handler);
  };
}

/**
 * Helper to wrap async functions with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(
        'error',
        `Error in ${context}`,
        error,
        { function: fn.name, arguments: args }
      );
      throw error; // Re-throw for handling
    }
  }) as T;
}
