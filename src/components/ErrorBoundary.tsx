/**
 * React Error Boundary Component
 *
 * Catches React rendering errors and logs them to the error tracking system.
 * Displays fallback UI to users when errors occur.
 *
 * Usage in Astro:
 * ```astro
 * ---
 * import ErrorBoundary from '@/components/ErrorBoundary';
 * import MyComponent from '@/components/MyComponent';
 * ---
 *
 * <ErrorBoundary client:load>
 *   <MyComponent client:load />
 * </ErrorBoundary>
 * ```
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logError } from '../lib/error-tracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to tracking system
    logError(
      'error',
      'React component error',
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback" role="alert">
          <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-700 mb-4">
              We're sorry, but there was an error loading this content.
              Our team has been notified and is working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
