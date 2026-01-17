-- ============================================================================
-- Migration 001: Error Logging Infrastructure
-- Purpose: Create error_logs table for production error tracking and monitoring
-- Author: Ben (Backend Developer)
-- Date: 2026-01-16
-- Story: E6-S02 Error Tracking & Logging
-- ============================================================================

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('critical', 'error', 'warn', 'info')),
  service TEXT NOT NULL CHECK(service IN ('worker', 'frontend', 'd1', 'r2', 'external_api')),
  message TEXT NOT NULL,
  stack TEXT,
  error_code TEXT,

  -- Context information
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  user_agent TEXT,
  cf_ray TEXT,
  request_id TEXT NOT NULL,
  user_id TEXT,
  additional_data TEXT, -- JSON string

  -- Deduplication and aggregation
  fingerprint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),

  -- Indexes for querying
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs(service);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON error_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;

-- Composite index for time-based queries by level
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp_level ON error_logs(timestamp DESC, level);

-- Unique constraint for deduplication (fingerprint + timestamp hour)
-- This allows same error to be logged separately if it occurs in different hours
CREATE UNIQUE INDEX IF NOT EXISTS idx_error_logs_dedup ON error_logs(
  fingerprint,
  strftime('%Y-%m-%d %H', timestamp)
);

-- ============================================================================
-- Comments
-- ============================================================================

-- This table stores all application errors with:
-- 1. Structured categorization (level, service)
-- 2. Full context (stack trace, request details)
-- 3. Deduplication via fingerprints
-- 4. Aggregation via count field
-- 5. Time-based retention (30 days default, cleaned via cron)

-- ============================================================================
-- Retention Policy
-- ============================================================================

-- Error logs are retained for 30 days by default
-- Cleanup is handled by the error logger utility
-- Critical errors can be flagged for longer retention in production

-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Get error rate for last hour:
-- SELECT
--   level,
--   COUNT(*) as count,
--   COUNT(*) / 60.0 as errors_per_minute
-- FROM error_logs
-- WHERE timestamp >= datetime('now', '-1 hour')
-- GROUP BY level;

-- Get most common errors (by fingerprint):
-- SELECT
--   message,
--   fingerprint,
--   SUM(count) as total_occurrences,
--   MAX(last_seen) as last_occurrence
-- FROM error_logs
-- WHERE timestamp >= datetime('now', '-24 hours')
-- GROUP BY fingerprint
-- ORDER BY total_occurrences DESC
-- LIMIT 10;

-- Get errors for specific request:
-- SELECT * FROM error_logs
-- WHERE request_id = 'req_xxx'
-- ORDER BY timestamp;

-- ============================================================================
-- End of Migration 001
-- ============================================================================
