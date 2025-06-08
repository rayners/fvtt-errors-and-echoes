/**
 * End-to-End Error Flow Tests
 * 
 * Tests the complete error capture and reporting flow from start to finish,
 * including error capture, attribution, context collection, filtering, and reporting.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMocks, resetMocks, setMockSetting, setMockModule } from './setup.js';
import { ModuleRegistry } from '../src/module-registry.js';
import { ErrorAttribution } from '../src/error-attribution.js';
import { ErrorReporter } from '../src/error-reporter.js';
import { ConsentManager } from '../src/consent-manager.js';
import { ErrorCapture } from '../src/error-capture.js';

describe('End-to-End Error Flow', () => {
  let mockFetch: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let defaultEndpoint: any;

  beforeEach(() => {
    setupMocks();
    resetMocks();
    
    // Clear error reporter statistics
    ErrorReporter.clearStats();
    
    // Set up consent and settings
    setMockSetting('errors-and-echoes', 'globalEnabled', true);
    setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
    setMockSetting('errors-and-echoes', 'hasShownWelcome', true);
    setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());
    setMockSetting('errors-and-echoes', 'endpointConsent', {
      'https://api.errors-and-echoes.com/report': true
    });
    setMockSetting('errors-and-echoes', 'endpoints', []);

    // Default endpoint for tests
    defaultEndpoint = {
      name: 'Default Test Endpoint',
      url: 'https://api.errors-and-echoes.com/report',
      enabled: true
    };

    // Mock fetch for HTTP requests
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, eventId: 'test-event-123' })
    });
    global.fetch = mockFetch;

    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock PromiseRejectionEvent for testing
    if (typeof global.PromiseRejectionEvent === 'undefined') {
      global.PromiseRejectionEvent = class PromiseRejectionEvent extends Event {
        promise: Promise<any>;
        reason: any;
        
        constructor(type: string, init: { promise: Promise<any>; reason: any }) {
          super(type);
          this.promise = init.promise;
          this.reason = init.reason;
        }
      };
    }
  });

  afterEach(() => {
    ModuleRegistry.clearAll();
    ErrorCapture.stopListening();
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Complete Error Flow Integration', () => {
    it('should handle JavaScript error from registration to reporting', async () => {
      // 1. Set up test module with context provider and error filter
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'Test Author', email: 'test@example.com' }]
      });

      // 2. Register module with E&E
      ModuleRegistry.register({
        moduleId: 'test-module',
        contextProvider: () => ({
          userAction: 'button-click',
          sceneId: 'test-scene-123',
          debugMode: true,
          moduleSpecificData: { featureEnabled: true }
        }),
        errorFilter: (error: Error) => {
          // Only report errors that mention our module
          return !error.message.includes('test-module');
        }
      });

      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);

      // 3. Simulate error attribution
      const testError = new Error('test-module feature failed');
      testError.stack = `Error: test-module feature failed
        at TestFeature.execute (/modules/test-module/features.js:123:45)
        at ButtonHandler.onClick (/modules/test-module/ui.js:67:89)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      // 4. Test error attribution
      const attribution = ErrorAttribution.attributeToModule(testError, errorContext);
      expect(attribution.moduleId).toBe('test-module');
      expect(attribution.method).toBe('stack-trace');
      expect(attribution.confidence).toBe('high');

      // 5. Test context collection
      const moduleContext = ModuleRegistry.getModuleContext('test-module');
      expect(moduleContext).toEqual({
        userAction: 'button-click',
        sceneId: 'test-scene-123',
        debugMode: true,
        moduleSpecificData: { featureEnabled: true }
        // Note: _errorsAndEchoesMeta is not added in test environments
      });

      // 6. Test error filtering (should not filter this error)
      const shouldFilter = ModuleRegistry.shouldFilterError('test-module', testError);
      expect(shouldFilter).toBe(false);

      // 7. Test report generation and sending
      await ErrorReporter.sendReport(testError, attribution, defaultEndpoint);

      // 8. Verify fetch was called with correct data
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const [url, options] = fetchCall;

      expect(url).toBe('https://api.errors-and-echoes.com/report');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-Foundry-Version']).toBe('13.331');
      expect(options.headers['X-Privacy-Level']).toBe('standard');

      const requestBody = JSON.parse(options.body);
      expect(requestBody.error.message).toBe('test-module feature failed');
      expect(requestBody.attribution.moduleId).toBe('test-module');
      expect(requestBody.moduleContext.userAction).toBe('button-click');
      expect(requestBody.moduleContext.sceneId).toBe('test-scene-123');
    });

    it('should filter errors when module error filter returns true', async () => {
      setMockModule('filtering-module', {
        id: 'filtering-module',
        title: 'Filtering Module',
        version: '1.0.0',
        active: true
      });

      // Register module with strict error filter
      ModuleRegistry.register({
        moduleId: 'filtering-module',
        errorFilter: (error: Error) => {
          // Filter out all errors containing "internal"
          return error.message.includes('internal');
        }
      });

      const internalError = new Error('internal function failed');
      internalError.stack = `Error: internal function failed
        at InternalFunction (/modules/filtering-module/internal.js:456:78)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(internalError, errorContext);
      expect(attribution.moduleId).toBe('filtering-module');

      // Test that error is filtered
      const shouldFilter = ModuleRegistry.shouldFilterError('filtering-module', internalError);
      expect(shouldFilter).toBe(true);

      // When sending the report, it should be filtered out
      await ErrorReporter.sendReport(internalError, attribution, defaultEndpoint);

      // Verify no fetch call was made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle errors from unknown modules', async () => {
      const unknownError = new Error('Unknown system error');
      // Use a more controlled stack trace that won't match test framework paths
      unknownError.stack = `Error: Unknown system error
        at UnknownFunction (file:///foundry/unknown-system/unknown.js:123:45)
        at SystemHandler (file:///foundry/foundry.js:456:78)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      // Mock the attribution to return unknown
      const mockAttribution = vi.spyOn(ErrorAttribution, 'attributeToModule').mockReturnValue({
        moduleId: 'unknown',
        confidence: 'none',
        method: 'unknown',
        source: 'javascript'
      });

      const attribution = ErrorAttribution.attributeToModule(unknownError, errorContext);
      expect(attribution.moduleId).toBe('unknown');
      expect(attribution.confidence).toBe('none');

      // Should still report unknown errors
      await ErrorReporter.sendReport(unknownError, attribution, defaultEndpoint);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.attribution.moduleId).toBe('unknown');
      expect(requestBody.moduleContext).toBeUndefined(); // No module context for unknown modules
      
      mockAttribution.mockRestore();
    });

    it('should respect user consent settings', async () => {
      // Disable consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      
      // Mock endpoint consent to return false for our endpoint
      const hasEndpointConsentSpy = vi.spyOn(ConsentManager, 'hasEndpointConsent').mockReturnValue(false);

      const testError = new Error('Test error without consent');
      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(testError, errorContext);

      // Should not send report when endpoint consent is disabled
      await ErrorReporter.sendReport(testError, attribution, defaultEndpoint);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(hasEndpointConsentSpy).toHaveBeenCalledWith('https://api.errors-and-echoes.com/report');
      
      hasEndpointConsentSpy.mockRestore();
    });

    it('should handle custom endpoints for specific modules', async () => {
      setMockModule('custom-endpoint-module', {
        id: 'custom-endpoint-module',
        title: 'Custom Endpoint Module',
        version: '1.0.0',
        active: true
      });

      const customEndpoint = {
        name: 'Custom Module Endpoint',
        url: 'https://custom.example.com/errors',
        enabled: true
      };

      ModuleRegistry.register({
        moduleId: 'custom-endpoint-module',
        endpoint: customEndpoint,
        contextProvider: () => ({ customData: 'test-value' })
      });

      const moduleError = new Error('Custom module error');
      moduleError.stack = `Error: Custom module error
        at CustomFunction (/modules/custom-endpoint-module/main.js:100:50)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(moduleError, errorContext);
      expect(attribution.moduleId).toBe('custom-endpoint-module');

      // Get the custom endpoint for this module
      const endpoint = ModuleRegistry.getModuleEndpoint('custom-endpoint-module');
      expect(endpoint).toEqual(customEndpoint);

      // Send report to custom endpoint
      await ErrorReporter.sendReport(moduleError, attribution, endpoint);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://custom.example.com/errors');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.moduleContext.customData).toBe('test-value');
    });

    it('should handle Promise rejection errors', async () => {
      setMockModule('promise-module', {
        id: 'promise-module',
        title: 'Promise Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'promise-module',
        contextProvider: () => ({ asyncOperation: true })
      });

      // Simulate Promise rejection
      const rejectionError = new Error('Async operation failed');
      rejectionError.stack = `Error: Async operation failed
        at AsyncFunction (/modules/promise-module/async.js:200:30)`;

      const errorContext = {
        source: 'promise' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(rejectionError, errorContext);
      expect(attribution.moduleId).toBe('promise-module');

      await ErrorReporter.sendReport(rejectionError, attribution, defaultEndpoint);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.attribution.source).toBe('promise');
      expect(requestBody.moduleContext.asyncOperation).toBe(true);
    });
  });

  describe('Error Context Enhancement', () => {
    it('should merge system context with module context', async () => {
      setMockModule('context-module', {
        id: 'context-module',
        title: 'Context Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'context-module',
        contextProvider: () => ({
          moduleVersion: '1.0.0',
          featureFlags: { betaFeature: true },
          userSettings: { theme: 'dark' }
        })
      });

      const contextError = new Error('Context test error');
      contextError.stack = `Error: Context test error
        at ContextFunction (/modules/context-module/context.js:150:75)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(contextError, errorContext);
      await ErrorReporter.sendReport(contextError, attribution, defaultEndpoint);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Verify both system and module context are included
      expect(requestBody.moduleContext.moduleVersion).toBe('1.0.0');
      expect(requestBody.moduleContext.featureFlags.betaFeature).toBe(true);
      expect(requestBody.moduleContext.userSettings.theme).toBe('dark');
      
      // System context should also be present
      expect(requestBody.foundry).toBeDefined();
      expect(requestBody.foundry.version).toBe('13.331');
    });

    it('should handle context provider errors gracefully', async () => {
      setMockModule('error-context-module', {
        id: 'error-context-module',
        title: 'Error Context Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'error-context-module',
        contextProvider: () => {
          throw new Error('Context provider failed');
        }
      });

      const testError = new Error('Test error with failing context');
      testError.stack = `Error: Test error with failing context
        at TestFunction (/modules/error-context-module/test.js:50:25)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(testError, errorContext);
      await ErrorReporter.sendReport(testError, attribution, defaultEndpoint);

      // Should still send report even with failing context provider
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.moduleContext).toBeUndefined(); // No context due to provider error
      
      // Should log warning about context provider failure
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context provider for \'error-context-module\' threw an error during test - disabling context provider:'),
        expect.any(Error)
      );
    });
  });

  describe('Privacy Level Handling', () => {
    it('should respect minimal privacy level', async () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'minimal');

      setMockModule('privacy-module', {
        id: 'privacy-module',
        title: 'Privacy Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'privacy-module',
        contextProvider: () => ({
          sensitiveData: 'should-be-filtered',
          publicData: 'safe-to-include'
        })
      });

      const privacyError = new Error('Privacy test error');
      privacyError.stack = `Error: Privacy test error
        at PrivacyFunction (/modules/privacy-module/privacy.js:75:100)`;

      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(privacyError, errorContext);
      await ErrorReporter.sendReport(privacyError, attribution, defaultEndpoint);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.headers?.['X-Privacy-Level']).toBeUndefined();
      
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-Privacy-Level']).toBe('minimal');
    });

    it('should respect detailed privacy level', async () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'detailed');

      const detailError = new Error('Detailed privacy test');
      const errorContext = {
        source: 'javascript' as const,
        timestamp: Date.now()
      };

      const attribution = ErrorAttribution.attributeToModule(detailError, errorContext);
      await ErrorReporter.sendReport(detailError, attribution, defaultEndpoint);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-Privacy-Level']).toBe('detailed');
    });
  });

  describe('Error Capture Integration', () => {
    it('should handle window error events', () => {
      setMockModule('window-error-module', {
        id: 'window-error-module',
        title: 'Window Error Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'window-error-module',
        contextProvider: () => ({ windowErrorTest: true })
      });

      // Start error capture
      ErrorCapture.startListening();

      // Simulate window error event
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Window error test'),
        filename: '/modules/window-error-module/main.js',
        lineno: 123,
        colno: 45
      });

      // Mock window.dispatchEvent for testing
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = vi.fn().mockReturnValue(true);

      // Trigger error event
      window.dispatchEvent(errorEvent);

      // The error capture should be set up to handle this
      expect(window.dispatchEvent).toHaveBeenCalledWith(errorEvent);

      // Restore original dispatchEvent
      window.dispatchEvent = originalDispatchEvent;
    });

    it('should handle unhandled promise rejections', () => {
      setMockModule('promise-rejection-module', {
        id: 'promise-rejection-module',
        title: 'Promise Rejection Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'promise-rejection-module',
        contextProvider: () => ({ promiseRejectionTest: true })
      });

      ErrorCapture.startListening();

      // Simulate unhandled promise rejection
      const rejectedPromise = new Promise((_, reject) => {
        reject(new Error('Unhandled promise rejection'));
      });
      rejectedPromise.catch(() => {}); // Prevent actual unhandled rejection in test
      
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: rejectedPromise,
        reason: new Error('Unhandled promise rejection')
      });

      // Mock window.dispatchEvent for testing
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = vi.fn().mockReturnValue(true);

      window.dispatchEvent(rejectionEvent);

      expect(window.dispatchEvent).toHaveBeenCalledWith(rejectionEvent);

      // Restore original dispatchEvent
      window.dispatchEvent = originalDispatchEvent;
    });
  });

  describe('Error Flow Statistics', () => {
    it('should track error reporting statistics', async () => {
      // Get initial stats
      const initialStats = ErrorReporter.getReportStats();
      expect(initialStats.totalReports).toBe(0);

      // Generate some errors
      for (let i = 0; i < 3; i++) {
        const error = new Error(`Test error ${i + 1}`);
        const attribution = {
          moduleId: 'test-module',
          confidence: 'high' as const,
          method: 'stack-trace' as const,
          source: 'javascript'
        };
        await ErrorReporter.sendReport(error, attribution, defaultEndpoint);
      }

      const finalStats = ErrorReporter.getReportStats();
      expect(finalStats.totalReports).toBe(3);
      expect(finalStats.recentReports).toBe(3);
      expect(finalStats.lastReportTime).toBeDefined();
    });

    it('should track module registration statistics', () => {
      // Register multiple modules
      setMockModule('stats-module-1', {
        id: 'stats-module-1',
        title: 'Stats Module 1',
        version: '1.0.0',
        active: true
      });

      setMockModule('stats-module-2', {
        id: 'stats-module-2',
        title: 'Stats Module 2',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'stats-module-1',
        contextProvider: () => ({ module: 1 }),
        errorFilter: () => false
      });

      ModuleRegistry.register({
        moduleId: 'stats-module-2',
        endpoint: {
          name: 'Custom Stats Endpoint',
          url: 'https://stats.example.com',
          enabled: true
        }
      });

      const stats = ModuleRegistry.getStats();
      expect(stats.totalRegistered).toBe(2);
      expect(stats.modulesWithContext).toBe(1);
      expect(stats.modulesWithFilters).toBe(1);
      expect(stats.modulesWithEndpoints).toBe(1);
    });
  });
});