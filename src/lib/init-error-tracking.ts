/**
 * Error Tracking Initialization Script
 *
 * Import and call this in your main app entry point (e.g., in layout or _app)
 * to enable automatic error tracking across the application.
 *
 * Usage in Astro Layout:
 * ```astro
 * ---
 * // In src/layouts/Layout.astro
 * ---
 * <script>
 *   import { initErrorTracking } from '@/lib/init-error-tracking';
 *   initErrorTracking();
 * </script>
 * ```
 */

import { initErrorTracking } from './error-tracking';

// Export for manual initialization
export { initErrorTracking };

// Auto-initialize if in browser context
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initErrorTracking();
      console.log('[Error Tracking] Initialized');
    });
  } else {
    // DOM is already ready
    initErrorTracking();
    console.log('[Error Tracking] Initialized');
  }
}
