/**
 * Integration tests for the complete registration API flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, setMockModule, setMockSetting } from './setup';

beforeEach(async () => {
  resetMocks();
  
  // Set up mock modules
  setMockModule('test-module', {
    id: 'test-module',
    version: '1.0.0'
  });
  
  setMockModule('errors-and-echoes', {
    id: 'errors-and-echoes',
    version: '0.1.0',
    api: null
  });
  
  // Set up default settings
  setMockSetting('errors-and-echoes', 'globalEnabled', true);
  setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
  setMockSetting('errors-and-echoes', 'endpointConsent', {});
  setMockSetting('errors-and-echoes', 'endpoints', []);
  
  // Clear any existing imports to ensure fresh state
  vi.resetModules();
});

describe('Registration API Integration', () => {
  it('should provide complete registration API workflow', async () => {
    // Import all components
    const { ModuleRegistry } = await import('../src/module-registry');
    const { ErrorAttribution } = await import('../src/error-attribution');
    const { ErrorReporter } = await import('../src/error-reporter');
    const { ConsentManager } = await import('../src/consent-manager');
    
    // Clear registry
    ModuleRegistry.clearAll();
    
    // Mock consent
    vi.spyOn(ConsentManager, 'hasConsent').mockReturnValue(true);
    vi.spyOn(ConsentManager, 'hasEndpointConsent').mockReturnValue(true);
    vi.spyOn(ConsentManager, 'getPrivacyLevel').mockReturnValue('standard');

    // Mock fetch for error reporting
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        eventId: 'test-event-123'
      })
    });

    // 1. Register a module with context provider and error filter
    const contextProvider = () => ({
      sessionId: 'test-session-123',
      userAction: 'button-click',
      debugMode: true
    });

    const errorFilter = (error: Error) => error.message.includes('debug-only');

    const customEndpoint = {
      name: 'Custom Test Endpoint',
      url: 'https://custom.example.com/report/test',
      enabled: true
    };

    ModuleRegistry.register({
      moduleId: 'test-module',
      contextProvider,
      errorFilter,
      endpoint: customEndpoint
    });

    // 2. Verify registration
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.moduleId).toBe('test-module');
    expect(registered?.contextProvider).toBe(contextProvider);
    expect(registered?.errorFilter).toBe(errorFilter);
    expect(registered?.endpoint).toBe(customEndpoint);

    // 3. Test context provider integration
    const context = ModuleRegistry.getModuleContext('test-module');
    expect(context).toEqual({
      sessionId: 'test-session-123',
      userAction: 'button-click',
      debugMode: true
    });

    // 4. Test error filtering
    const normalError = new Error('Normal error message');
    const debugError = new Error('This is a debug-only error');
    
    expect(ModuleRegistry.shouldFilterError('test-module', normalError)).toBe(false);
    expect(ModuleRegistry.shouldFilterError('test-module', debugError)).toBe(true);

    // 5. Test attribution integration with registry
    const errorContext = {
      source: 'javascript' as const,
      timestamp: Date.now()
    };

    // Mock stack trace parsing to return our test module
    vi.spyOn(ErrorAttribution as any, 'parseStackTrace').mockReturnValue('test-module');

    const attribution = ErrorAttribution.attributeToModule(normalError, errorContext);
    expect(attribution.moduleId).toBe('test-module');
    expect(attribution.method).toBe('stack-trace'); // Should use stack trace method first

    // 6. Test error reporting with enhanced context
    await ErrorReporter.sendReport(normalError, attribution, customEndpoint);

    // Verify fetch was called with enhanced context
    expect(fetch).toHaveBeenCalledWith(
      'https://custom.example.com/report/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Foundry-Version': '13.331'
        }),
        body: expect.stringContaining('"sessionId":"test-session-123"')
      })
    );

    // 7. Test that filtered errors are not reported
    const filteredAttribution = {
      ...attribution,
      moduleId: 'test-module'
    };

    // Clear previous fetch calls
    vi.clearAllMocks();

    // This should not result in a report being sent
    await ErrorReporter.sendReport(debugError, filteredAttribution, customEndpoint);

    // Verify no fetch call was made for filtered error
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle registration errors gracefully', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();

    // Try to register non-existent module
    ModuleRegistry.register({
      moduleId: 'non-existent-module'
    });

    expect(ModuleRegistry.isRegistered('non-existent-module')).toBe(false);

    // Try to register with invalid context provider (need to set up mock first)
    setMockModule('test-module', {
      id: 'test-module',
      title: 'Test Module',
      active: true
    });
    
    ModuleRegistry.register({
      moduleId: 'test-module',
      contextProvider: (() => 'invalid') as any
    });

    // Should register but context provider should be disabled
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.contextProvider).toBeUndefined();
  });

  it('should provide registry statistics', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();

    // Register multiple modules with different features
    ModuleRegistry.register({
      moduleId: 'test-module',
      contextProvider: () => ({ test: true })
    });

    setMockModule('another-module', { id: 'another-module', version: '1.0.0' });
    ModuleRegistry.register({
      moduleId: 'another-module',
      errorFilter: () => false,
      endpoint: {
        name: 'Custom Endpoint',
        url: 'https://custom.example.com',
        enabled: true
      }
    });

    // Use the features to generate statistics
    ModuleRegistry.getModuleContext('test-module');
    ModuleRegistry.shouldFilterError('another-module', new Error('test'));

    const stats = ModuleRegistry.getStats();
    expect(stats.totalRegistered).toBe(2);
    expect(stats.modulesWithContext).toBe(1);
    expect(stats.modulesWithFilters).toBe(1);
    expect(stats.modulesWithEndpoints).toBe(1);
    expect(stats.totalContextCalls).toBe(1);
    expect(stats.totalFilterCalls).toBe(1);
  });

  it('should handle custom endpoints for registered modules', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();

    const customEndpoint = {
      name: 'Module-Specific Endpoint',
      url: 'https://module-specific.example.com/report',
      enabled: true
    };

    ModuleRegistry.register({
      moduleId: 'test-module',
      endpoint: customEndpoint
    });

    const endpoint = ModuleRegistry.getModuleEndpoint('test-module');
    expect(endpoint).toEqual(customEndpoint);

    // Non-registered module should return undefined
    const noEndpoint = ModuleRegistry.getModuleEndpoint('non-existent');
    expect(noEndpoint).toBeUndefined();
  });
});