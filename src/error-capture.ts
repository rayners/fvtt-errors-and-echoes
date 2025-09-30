/**
 * Error Capture System - CRITICAL: NEVER SWALLOW ERRORS
 *
 * This class listens for errors and captures them for reporting while ensuring
 * that all errors remain visible to users and continue normal propagation.
 */

import { ErrorAttribution } from './error-attribution.js';
import { ErrorReporter } from './error-reporter.js';
import { ConsentManager } from './consent-manager.js';
import { moduleMatchesAuthor } from './author-utils.js';
import { getModule, debugLog } from './utils.js';
import type { EndpointConfig } from './types.js';

interface ErrorContext {
  source: 'javascript' | 'promise' | 'console' | 'hook';
  event?: Event | PromiseRejectionEvent;
  hookName?: string;
  timestamp: number;
}

export class ErrorCapture {
  private static isListening = false;
  private static originalConsoleError: typeof console.error | null = null;
  private static originalConsoleWarn: typeof console.warn | null = null;
  private static originalHooksCall: typeof Hooks.call | null = null;
  private static originalHooksCallAll: typeof Hooks.callAll | null = null;

  /**
   * Start listening for errors - CRITICAL: NEVER preventDefault()
   */
  static startListening(): void {
    if (this.isListening) return;

    debugLog('Errors and Echoes: Starting error capture (errors will remain visible)');

    // JavaScript errors - NEVER preventDefault()
    window.addEventListener('error', this.handleWindowError.bind(this));

    // Promise rejections - NEVER preventDefault()
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Console.error patching (preserve original behavior)
    this.patchConsoleError();

    // Console.warn patching (preserve original behavior)
    this.patchConsoleWarn();

    // Foundry hook errors (don't interfere with hook execution)
    this.patchFoundryHooks();

    this.isListening = true;
  }

  /**
   * Stop listening for errors
   */
  static stopListening(): void {
    if (!this.isListening) return;

    debugLog('Errors and Echoes: Stopping error capture');

    // Remove error listeners
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Restore original console methods
    this.restoreConsoleError();
    this.restoreConsoleWarn();
    this.restoreFoundryHooks();

    this.isListening = false;
  }

  /**
   * Handle window error events - CRITICAL: NEVER preventDefault()
   */
  private static handleWindowError(event: ErrorEvent): void {
    try {
      const context: ErrorContext = {
        source: 'javascript',
        event,
        timestamp: Date.now(),
      };

      // Create synthetic Error if event.error is null (older browsers)
      const error = event.error || new Error(event.message || 'Unknown error');
      this.handleError(error, context);
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }

    // CRITICAL: Error continues normal propagation - we NEVER preventDefault()
    // Users MUST see the error in console and dev tools
  }

  /**
   * Handle unhandled promise rejections - CRITICAL: NEVER preventDefault()
   */
  private static handleUnhandledRejection(event: PromiseRejectionEvent): void {
    try {
      const context: ErrorContext = {
        source: 'promise',
        event,
        timestamp: Date.now(),
      };

      // Handle both Error objects and string rejections
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.handleError(error, context);
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }

    // CRITICAL: Rejection continues normal propagation - we NEVER preventDefault()
    // Users MUST see the rejection in console and dev tools
  }

  /**
   * Core error handling - reports error while preserving original behavior
   */
  private static handleError(error: Error, context: ErrorContext): void {
    if (!ConsentManager.hasConsent()) return;

    try {
      const attribution = ErrorAttribution.attributeToModule(error, context);
      const endpoint = this.getEndpointForModule(attribution.moduleId);

      if (endpoint && endpoint.enabled) {
        ErrorReporter.sendReport(error, attribution, endpoint, {
          ...context,
          capturedAt: new Date().toISOString(),
        });
      }
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }

    // CRITICAL: Never swallow the original error
    // It continues normal propagation automatically
    // Users can still see it in console and dev tools
  }

  /**
   * Patch console.error to capture console errors while preserving behavior
   */
  private static patchConsoleError(): void {
    if (this.originalConsoleError) return; // Already patched

    this.originalConsoleError = console.error;
    console.error = (...args: any[]): void => {
      // CRITICAL: Call original first so user sees the error
      this.originalConsoleError!.apply(console, args);

      // THEN try to report it
      try {
        if (args[0] instanceof Error) {
          const context: ErrorContext = {
            source: 'console',
            timestamp: Date.now(),
          };
          this.handleError(args[0], context);
        }
      } catch {
        // Don't let reporting errors affect console.error
        // Silent failure to avoid infinite loops
      }
    };
  }

  /**
   * Patch console.warn to capture warnings while preserving behavior
   */
  private static patchConsoleWarn(): void {
    if (this.originalConsoleWarn) return; // Already patched

    this.originalConsoleWarn = console.warn;
    console.warn = (...args: any[]): void => {
      // CRITICAL: Call original first so user sees the warning
      this.originalConsoleWarn!.apply(console, args);

      // THEN try to report it if it's an Error object
      try {
        if (args[0] instanceof Error) {
          const context: ErrorContext = {
            source: 'console',
            timestamp: Date.now(),
          };
          this.handleError(args[0], context);
        }
      } catch {
        // Silent failure to avoid infinite loops
      }
    };
  }

  /**
   * Patch Foundry's Hooks system to capture hook errors
   */
  private static patchFoundryHooks(): void {
    if (this.originalHooksCall) return; // Already patched

    this.originalHooksCall = Hooks.call;
    this.originalHooksCallAll = Hooks.callAll;

    // Patch Hooks.call
    Hooks.call = (hook: string, ...args: any[]): boolean => {
      try {
        return this.originalHooksCall!.call(Hooks, hook, ...args);
      } catch (error) {
        // Report the error with hook context
        const context: ErrorContext = {
          source: 'hook',
          hookName: hook,
          timestamp: Date.now(),
        };

        if (error instanceof Error) {
          this.handleError(error, context);
        }

        // CRITICAL: Re-throw the error so normal hook error handling continues
        throw error;
      }
    };

    // Patch Hooks.callAll
    Hooks.callAll = (hook: string, ...args: any[]): void => {
      try {
        this.originalHooksCallAll!.call(Hooks, hook, ...args);
      } catch (error) {
        // Report the error with hook context
        const context: ErrorContext = {
          source: 'hook',
          hookName: hook,
          timestamp: Date.now(),
        };

        if (error instanceof Error) {
          this.handleError(error, context);
        }

        // CRITICAL: Re-throw the error so normal hook error handling continues
        throw error;
      }
    };
  }

  /**
   * Restore original console.error
   */
  private static restoreConsoleError(): void {
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
  }

  /**
   * Restore original console.warn
   */
  private static restoreConsoleWarn(): void {
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
      this.originalConsoleWarn = null;
    }
  }

  /**
   * Restore original Foundry hooks
   */
  private static restoreFoundryHooks(): void {
    if (this.originalHooksCall) {
      Hooks.call = this.originalHooksCall;
      this.originalHooksCall = null;
    }

    if (this.originalHooksCallAll) {
      Hooks.callAll = this.originalHooksCallAll;
      this.originalHooksCallAll = null;
    }
  }

  /**
   * Get the endpoint configuration for a specific module
   */
  private static getEndpointForModule(moduleId: string): EndpointConfig | undefined {
    try {
      const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];

      return endpoints.find(endpoint => {
        if (!endpoint.enabled) return false;

        // Check if module is explicitly listed
        if (endpoint.modules?.includes(moduleId)) return true;

        // Check if module matches author
        if (endpoint.author) {
          const module = getModule(moduleId);
          return module && moduleMatchesAuthor(module, endpoint.author);
        }

        return false;
      });
    } catch (error) {
      console.warn('Errors and Echoes: Failed to get endpoint for module:', error);
      return undefined;
    }
  }

  /**
   * Check if error capture is currently active
   */
  static getIsListening(): boolean {
    return this.isListening;
  }
}
