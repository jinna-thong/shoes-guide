# Error Tracking & Logging System

**Story:** E6-S02 Error Tracking & Logging (5 SP)
**Author:** Ben (Backend Developer)
**Date:** 2026-01-16
**Status:** COMPLETE

---

## Overview

Production-ready error tracking system for shoes.guide built on Cloudflare Pages Functions (Workers) and D1 database. Provides structured error logging, categorization, real-time monitoring, and alerting.

### Features

✅ **Structured Error Logging** - Consistent format with context and metadata
✅ **Error Categorization** - Critical, Error, Warning, Info levels
✅ **Stack Trace Capture** - Full stack traces for debugging
✅ **Error Rate Monitoring** - Real-time error rate tracking and alerting
✅ **Client-Side Capture** - React Error Boundaries and global handlers
✅ **Deduplication** - Fingerprint-based error grouping
✅ **Retention Policy** - 30-day automatic cleanup
✅ **CORS Support** - Client-side logging from browser

---

## Architecture

```
┌─────────────────┐
│  Client Browser │
│   (Astro/React) │
└────────┬────────┘
         │ POST /api/error-log
         ↓
┌─────────────────────────┐
│  Cloudflare Worker      │
│  /api/error-log         │
│  - Validation           │
│  - Error Logging        │
└────────┬────────────────┘
         │ INSERT
         ↓
┌─────────────────────────┐
│  D1 Database            │
│  error_logs table       │
│  - Structured storage   │
│  - Deduplication        │
│  - Indexing             │
└─────────────────────────┘
         ↑
         │ SELECT
┌────────┴────────────────┐
│  Monitoring Endpoints   │
│  /api/errors/stats      │
│  /api/errors/cleanup    │
└─────────────────────────┘
```

---

## Database Schema

**Table:** `error_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| timestamp | TEXT | ISO 8601 timestamp |
| level | TEXT | critical/error/warn/info |
| service | TEXT | worker/frontend/d1/r2/external_api |
| message | TEXT | Error message |
| stack | TEXT | Stack trace (optional) |
| error_code | TEXT | Error name/code |
| url | TEXT | Request URL |
| method | TEXT | HTTP method |
| user_agent | TEXT | Browser user agent |
| cf_ray | TEXT | Cloudflare Ray ID |
| request_id | TEXT | Unique request ID |
| user_id | TEXT | User ID (if authenticated) |
| additional_data | TEXT | JSON-encoded context |
| fingerprint | TEXT | Deduplication hash |
| count | INTEGER | Aggregation counter |
| first_seen | TEXT | First occurrence |
| last_seen | TEXT | Last occurrence |

**Indexes:**
- `idx_error_logs_timestamp` - Time-based queries
- `idx_error_logs_level` - Filter by severity
- `idx_error_logs_service` - Filter by service
- `idx_error_logs_fingerprint` - Deduplication
- `idx_error_logs_timestamp_level` - Composite for monitoring

---

## API Endpoints

### 1. Log Error

**POST** `/api/error-log`

Log an error from client or server.

**Request Body:**
```json
{
  "level": "error",
  "service": "frontend",
  "message": "Failed to load product data",
  "stack": "Error: Failed...\n  at Component...",
  "url": "https://shoes.guide/products/nike-pegasus",
  "userAgent": "Mozilla/5.0...",
  "additionalData": {
    "productId": "123",
    "userId": "user_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Error logged successfully",
  "request_id": "req_1234567890_abc"
}
```

**Status Codes:**
- `201` - Error logged successfully
- `400` - Invalid request body
- `500` - Logging failed

---

### 2. Get Error Statistics

**GET** `/api/errors/stats?minutes=60`

Get error statistics for monitoring.

**Query Parameters:**
- `minutes` - Time window (default: 60, max: 1440)

**Response:**
```json
{
  "total_errors": 42,
  "error_rate": 0.7,
  "critical_count": 2,
  "error_count": 35,
  "warn_count": 5,
  "alert_threshold_exceeded": false,
  "window_minutes": 60,
  "recent_errors": [
    {
      "id": "123",
      "timestamp": "2026-01-16T10:30:00Z",
      "level": "error",
      "service": "frontend",
      "message": "Component render failed",
      "url": "/products/nike-pegasus",
      "fingerprint": "fp_abc123",
      "count": 3
    }
  ]
}
```

---

### 3. Cleanup Old Logs

**POST** `/api/errors/cleanup`

Remove error logs older than retention period (30 days).

**Headers:**
- `Authorization: Bearer <API_KEY>` (if configured)

**Response:**
```json
{
  "success": true,
  "deleted_count": 1523,
  "retention_days": 30,
  "timestamp": "2026-01-16T10:00:00Z"
}
```

---

## Client-Side Integration

### Initialize Error Tracking

Add to your main layout (`src/layouts/Layout.astro`):

```astro
---
// Layout.astro
---
<!DOCTYPE html>
<html>
  <head>
    <!-- ... -->
  </head>
  <body>
    <slot />

    <script>
      import { initErrorTracking } from '@/lib/init-error-tracking';
      initErrorTracking();
    </script>
  </body>
</html>
```

### Use Error Boundaries

Wrap React components with error boundaries:

```astro
---
import ErrorBoundary from '@/components/ErrorBoundary';
import ProductCard from '@/components/ProductCard';
---

<ErrorBoundary client:load>
  <ProductCard client:load productId="123" />
</ErrorBoundary>
```

### Manual Error Logging

```typescript
import { logError } from '@/lib/error-tracking';

try {
  await fetchProductData(productId);
} catch (error) {
  await logError('error', 'Failed to fetch product', error, {
    productId,
    userId: currentUser.id
  });
  throw error; // Re-throw or handle
}
```

---

## Worker-Side Integration

### Log Errors in Workers

```typescript
import { ErrorLogger, extractErrorContext, determineErrorLevel } from './_lib/error-logger';

export const onRequest: PagesFunction<Env> = async (context) => {
  const logger = new ErrorLogger(context.env.DB);

  try {
    // Your worker logic
    const data = await fetchData();
    return new Response(JSON.stringify(data));
  } catch (error) {
    // Log the error
    await logger.logError(
      determineErrorLevel(error),
      'Worker operation failed',
      error,
      extractErrorContext(context.request),
      'worker'
    );

    return new Response('Internal Server Error', { status: 500 });
  }
};
```

---

## Monitoring & Alerting

### Error Rate Threshold

The system checks if error rate exceeds **1% of requests** or **1 error per minute**.

**Alert Conditions:**
- Error rate > 1 error/minute for 5 minutes
- Critical errors > 0 in last hour
- Database errors detected

### Monitoring Dashboard

Use `/api/errors/stats` to build monitoring dashboards:

```javascript
// Fetch error stats every minute
setInterval(async () => {
  const response = await fetch('/api/errors/stats?minutes=5');
  const stats = await response.json();

  if (stats.alert_threshold_exceeded) {
    sendAlert('Error rate threshold exceeded!', stats);
  }

  updateDashboard(stats);
}, 60000);
```

---

## Scheduled Cleanup

Configure Cloudflare Cron Triggers to run cleanup daily:

**wrangler.toml:**
```toml
[triggers]
crons = ["0 2 * * *"]  # Daily at 2 AM UTC
```

**Cron handler:**
```typescript
export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  // Run error log cleanup
  const response = await fetch('https://shoes.guide/api/errors/cleanup', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.ERROR_CLEANUP_API_KEY}`
    }
  });

  const result = await response.json();
  console.log('Cleanup completed:', result);
}
```

---

## Error Levels Guide

| Level | Use Case | Examples |
|-------|----------|----------|
| **critical** | System failures, data corruption | Database unavailable, payment processing failed |
| **error** | Operation failures, exceptions | API call failed, invalid data, resource not found |
| **warn** | Degraded functionality, recoverable issues | Slow response time, deprecated API usage |
| **info** | Informational events | Feature usage, configuration changes |

---

## Deployment Checklist

### 1. Database Setup

```bash
# Apply migration
wrangler d1 execute shoes-engagement --file=migrations/001_create_error_logs.sql

# Verify table creation
wrangler d1 execute shoes-engagement --command="SELECT name FROM sqlite_master WHERE type='table' AND name='error_logs';"
```

### 2. Environment Variables

Add to Cloudflare Pages settings:

```
ERROR_CLEANUP_API_KEY=<secure_random_key>
```

### 3. Test Error Logging

```bash
# Test POST endpoint
curl -X POST https://shoes.guide/api/error-log \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "service": "frontend",
    "message": "Test error",
    "url": "https://shoes.guide/test"
  }'

# Test stats endpoint
curl https://shoes.guide/api/errors/stats?minutes=60
```

### 4. Configure Monitoring

- Set up Cloudflare Analytics
- Configure error rate alerts
- Create monitoring dashboard
- Set up scheduled cleanup cron

---

## File Structure

```
web/lens-web/
├── migrations/
│   └── 001_create_error_logs.sql           # D1 schema
├── functions/
│   ├── _lib/
│   │   └── error-logger.ts                 # Error logging utility
│   └── api/
│       ├── error-log.ts                    # POST /api/error-log
│       └── errors/
│           ├── stats.ts                    # GET /api/errors/stats
│           └── cleanup.ts                  # POST /api/errors/cleanup
└── src/
    ├── components/
    │   └── ErrorBoundary.tsx               # React Error Boundary
    └── lib/
        ├── error-tracking.ts               # Client-side tracking
        └── init-error-tracking.ts          # Auto-initialization
```

---

## Testing

### Manual Testing

1. **Trigger an error:**
```javascript
// In browser console
throw new Error('Test error from console');
```

2. **Check error was logged:**
```bash
curl https://shoes.guide/api/errors/stats?minutes=5
```

3. **Verify database:**
```bash
wrangler d1 execute shoes-engagement --command="SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 5;"
```

### Automated Testing

```typescript
// test/error-tracking.test.ts
import { describe, it, expect } from 'vitest';
import { logError } from '@/lib/error-tracking';

describe('Error Tracking', () => {
  it('should log error to API', async () => {
    await logError('error', 'Test error', new Error('Test'));
    // Assert API was called (mock fetch)
  });
});
```

---

## Performance Considerations

- **Async Logging:** Error logging is non-blocking
- **Batch Processing:** Consider batching client-side logs
- **Index Optimization:** D1 indexes optimize queries
- **Retention:** 30-day retention prevents table bloat
- **Deduplication:** Fingerprinting reduces storage

---

## Security

- **API Authentication:** Cleanup endpoint uses API key
- **CORS:** Restricted to same origin (configurable)
- **Data Sanitization:** No PII in error logs by default
- **Rate Limiting:** Prevent log flooding (implement in Worker)

---

## Troubleshooting

### Error logging not working

1. Check D1 binding in `wrangler.toml`
2. Verify migration applied: `wrangler d1 migrations list shoes-engagement`
3. Check browser console for fetch errors
4. Verify CORS headers on API endpoint

### High error rates

1. Check `/api/errors/stats` for breakdown
2. Review recent errors by fingerprint
3. Check D1 database size and performance
4. Review application logs for patterns

---

## Future Enhancements

- [ ] Error grouping by fingerprint in UI
- [ ] Email/Slack alerting integration
- [ ] Error replay/reproduction tools
- [ ] Performance metrics correlation
- [ ] User session replay integration
- [ ] AI-powered error analysis

---

## References

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare D1 Database](https://developers.cloudflare.com/d1/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Astro Islands](https://docs.astro.build/en/concepts/islands/)

---

**Document Status:** Complete
**Last Updated:** 2026-01-16
**Next Review:** After production deployment
