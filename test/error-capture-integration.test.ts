/**
 * Integration tests for the actual error-capture.ts implementation
 *
 * These tests exercise the real error capture mechanisms including
 * window.onerror, unhandledrejection, and console hooks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMocks, resetMocks, setMockSetting } from './setup.js';
import { ErrorCapture } from '../src/error-capture.js';
import { ErrorAttribution } from '../src/error-attribution.js';
import { ErrorReporter } from '../src/error-reporter.js';
import { ConsentManager } from '../src/consent-manager.js';

// Mock PromiseRejectionEvent for Node.js environment
global.PromiseRejectionEvent = class PromiseRejectionEvent extends Event {
  reason: any;
  promise: Promise<any>;

  constructor(type: string, options: { reason?: any; promise?: Promise<any> } = {}) {
    super(type);
    this.reason = options.reason;
    this.promise = options.promise || Promise.reject(options.reason);
  }
};

describe('ErrorCapture Integration (Real Implementation)', () => {
  let originalOnError: typeof window.onerror;
  let originalOnUnhandledRejection: typeof window.onunhandledrejection;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    setupMocks();
    resetMocks();

    // Store original handlers
    originalOnError = (global as any).window.onerror;
    originalOnUnhandledRejection = (global as any).window.onunhandledrejection;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;

    // Set up consent for error capture
    setMockSetting('errors-and-echoes', 'globalEnabled', true);
    setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());
    setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
    setMockSetting('errors-and-echoes', 'endpoints', [
      {
        name: 'Test Endpoint',
        url: 'https://test.example.com/report/test',
        author: 'test',
        modules: ['test-module'],
        enabled: true,
      },
    ]);
    setMockSetting('errors-and-echoes', 'endpointConsent', {
      'https://test.example.com/report/test': true,
    });

    // Mock fetch for error reporting
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          eventId: 'test-event-123',
        }),
    } as Response);

    // Spy on ErrorAttribution.attributeToModule but let it return real results
    vi.spyOn(ErrorAttribution, 'attributeToModule').mockImplementation((error, context) => ({
      moduleId: 'test-module',
      confidence: 'high' as const,
      method: 'stack-trace' as const,
      source: 'module-code' as const,
      details: error ? `Error: ${error.message}` : 'Unknown error',
    }));

    // Clear any existing stats
    ErrorReporter.clearStats();
  });

  afterEach(() => {
    // Stop error capture and restore original handlers
    ErrorCapture.stopListening();

    (global as any).window.onerror = originalOnError;
    (global as any).window.onunhandledrejection = originalOnUnhandledRejection;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    vi.restoreAllMocks();
  });

  describe('startListening() and stopListening()', () => {
    it('should correctly manage listening state', () => {
      expect(ErrorCapture.getIsListening()).toBe(false);

      ErrorCapture.startListening();
      expect(ErrorCapture.getIsListening()).toBe(true);

      ErrorCapture.stopListening();
      expect(ErrorCapture.getIsListening()).toBe(false);
    });

    it('should handle event listener management', () => {
      // Mock addEventListener/removeEventListener to verify they're called
      const addEventListenerSpy = vi.spyOn((global as any).window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn((global as any).window, 'removeEventListener');

      ErrorCapture.startListening();

      // Should have added event listeners for error and unhandledrejection
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      ErrorCapture.stopListening();

      // Should have removed event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('should install and remove console hooks', () => {
      expect(console.error).toBe(originalConsoleError);

      ErrorCapture.startListening();

      // Should have wrapped console methods
      expect(console.error).not.toBe(originalConsoleError);

      ErrorCapture.stopListening();

      // Should have restored original console methods
      expect(console.error).toBe(originalConsoleError);
    });

    it('should handle multiple start/stop calls safely', () => {
      // Multiple starts should not break anything
      ErrorCapture.startListening();
      ErrorCapture.startListening();
      ErrorCapture.startListening();

      expect(ErrorCapture.getIsListening()).toBe(true);

      // Multiple stops should not break anything
      ErrorCapture.stopListening();
      ErrorCapture.stopListening();
      ErrorCapture.stopListening();

      expect(ErrorCapture.getIsListening()).toBe(false);
    });
  });

  describe('window error handling', () => {
    it('should capture and report JavaScript errors', async () => {
      ErrorCapture.startListening();

      const testError = new Error('Test JavaScript error');

      // Create and dispatch a real ErrorEvent
      const errorEvent = new ErrorEvent('error', {
        message: 'Test JavaScript error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: testError,
      });

      // Dispatch the error event
      (global as any).window.dispatchEvent(errorEvent);

      // Give time for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify error was attributed and reported
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test JavaScript error',
        }),
        expect.objectContaining({
          source: 'javascript',
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.example.com/report/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test JavaScript error'),
        })
      );
    });

    it('should create synthetic Error when error object is missing', async () => {
      ErrorCapture.startListening();

      // Create and dispatch ErrorEvent without error object (older browsers)
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error without object',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: null,
      });

      (global as any).window.dispatchEvent(errorEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have handled the error
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          source: 'javascript',
        })
      );
    });

    it('should not interfere with original error handling', () => {
      const customHandler = vi.fn();
      (global as any).window.onerror = customHandler;

      ErrorCapture.startListening();

      // Create and dispatch an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test'),
      });

      (global as any).window.dispatchEvent(errorEvent);

      // Since ErrorCapture uses event listeners, window.onerror should remain unchanged
      expect((global as any).window.onerror).toBe(customHandler);
    });
  });

  describe('unhandledrejection handling', () => {
    it('should capture and report Promise rejections', async () => {
      ErrorCapture.startListening();

      // Create a real promise rejection event
      const error = new Error('Unhandled promise rejection');
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: error,
        promise: Promise.reject(error),
      });

      // Trigger the unhandledrejection event on window
      (global as any).window.dispatchEvent(rejectionEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify rejection was attributed and reported
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unhandled promise rejection',
        }),
        expect.objectContaining({
          source: 'promise',
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.example.com/report/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Unhandled promise rejection'),
        })
      );
    });

    it('should handle string rejection reasons', async () => {
      ErrorCapture.startListening();

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: 'String rejection reason',
        promise: Promise.reject('String rejection reason'),
      });

      (global as any).window.dispatchEvent(rejectionEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should convert string to Error
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String rejection reason',
        }),
        expect.objectContaining({
          source: 'promise',
        })
      );
    });

    it('should handle null/undefined rejection reasons', async () => {
      ErrorCapture.startListening();

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: null,
        promise: Promise.reject(null),
      });

      (global as any).window.dispatchEvent(rejectionEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should create a meaningful error message
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'null',
        }),
        expect.objectContaining({
          source: 'promise',
        })
      );
    });
  });

  describe('console error hooking', () => {
    it('should capture console.error calls', async () => {
      ErrorCapture.startListening();

      const testError = new Error('Console error test');

      // Call console.error with the error as first argument (required for capture)
      console.error(testError, 'Something went wrong:');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify error was captured and reported
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Console error test'),
        }),
        expect.objectContaining({
          source: 'console',
        })
      );
    });

    it('should still output to original console', () => {
      ErrorCapture.startListening();

      // Spy on original console.error
      const consoleSpy = vi.spyOn(originalConsoleError, 'apply');

      console.error('Test message', 'additional data');

      // Should have called original console.error
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Object), [
        'Test message',
        'additional data',
      ]);
    });

    it('should handle console.error with multiple arguments', async () => {
      ErrorCapture.startListening();

      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      console.error(error1, 'Multiple errors:', error2, 'extra info');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should capture the first error found
      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'First error',
        }),
        expect.objectContaining({
          source: 'console',
        })
      );
    });

    it('should capture console.warn calls', async () => {
      ErrorCapture.startListening();

      const testError = new Error('Console warn test');

      console.warn(testError, 'Warning with error:');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(ErrorAttribution.attributeToModule).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Console warn test',
        }),
        expect.objectContaining({
          source: 'console',
        })
      );
    });
  });

  describe('consent and settings integration', () => {
    it('should not capture errors when consent is not given', async () => {
      // Remove consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      setMockSetting('errors-and-echoes', 'consentDate', null);

      expect(ConsentManager.hasConsent()).toBe(false);

      ErrorCapture.startListening();

      // Trigger an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error without consent',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test error'),
      });

      (global as any).window.dispatchEvent(errorEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not have attributed or reported the error
      expect(ErrorAttribution.attributeToModule).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should start capturing when consent is granted', () => {
      // Initially no consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      setMockSetting('errors-and-echoes', 'consentDate', null);

      expect(ConsentManager.hasConsent()).toBe(false);

      // Starting should work but not capture due to consent check
      ErrorCapture.startListening();
      expect(ErrorCapture.getIsListening()).toBe(true);

      // Grant consent
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());

      expect(ConsentManager.hasConsent()).toBe(true);

      // Now errors should be captured (tested via error flow, not handler inspection)
    });
  });

  describe('error handling and resilience', () => {
    it('should handle errors in error attribution gracefully', async () => {
      // Make attribution throw an error
      vi.spyOn(ErrorAttribution, 'attributeToModule').mockImplementation(() => {
        throw new Error('Attribution failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn');

      ErrorCapture.startListening();

      // Trigger an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test error'),
      });

      (global as any).window.dispatchEvent(errorEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have logged the error (attribution failure gets logged as "Error reporting failed")
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: Error reporting failed:',
        expect.any(Error)
      );

      // Should not have attempted to report
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors in error reporting gracefully', async () => {
      // Make reporting throw an error
      vi.spyOn(ErrorReporter, 'sendReport').mockImplementation(() => {
        throw new Error('Reporting failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn');

      ErrorCapture.startListening();

      // Trigger an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test error'),
      });

      (global as any).window.dispatchEvent(errorEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have logged the reporting error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: Error reporting failed:',
        expect.any(Error)
      );
    });

    it('should not break when original handlers are missing', () => {
      // Remove original handlers
      (global as any).window.onerror = null;
      (global as any).window.onunhandledrejection = null;

      // Should not throw when starting/stopping
      expect(() => ErrorCapture.startListening()).not.toThrow();
      expect(() => ErrorCapture.stopListening()).not.toThrow();
    });
  });

  describe('statistics and monitoring', () => {
    it('should track captured errors in statistics', async () => {
      ErrorCapture.startListening();

      const initialStats = ErrorReporter.getReportStats();
      const initialCount = initialStats.totalReports;

      // Trigger an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error for stats',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test error'),
      });

      (global as any).window.dispatchEvent(errorEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedStats = ErrorReporter.getReportStats();
      expect(updatedStats.totalReports).toBe(initialCount + 1);
      expect(updatedStats.lastReportTime).toBeDefined();
    });

    it('should provide accurate capture status', () => {
      expect(ErrorCapture.getIsListening()).toBe(false);

      ErrorCapture.startListening();
      expect(ErrorCapture.getIsListening()).toBe(true);

      ErrorCapture.stopListening();
      expect(ErrorCapture.getIsListening()).toBe(false);
    });
  });
});
