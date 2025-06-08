/**
 * Tests for ModuleRegistry class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, setMockModule } from './setup';

beforeEach(async () => {
  resetMocks();
  
  // Set up mock modules
  setMockModule('test-module', {
    id: 'test-module',
    version: '1.0.0'
  });
  
  setMockModule('another-module', {
    id: 'another-module',
    version: '2.0.0'
  });
  
  // Clear any existing imports to ensure fresh state
  vi.resetModules();
});

describe('ModuleRegistry', () => {
  it('should register a module with basic configuration', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    
    // Clear any existing registrations
    ModuleRegistry.clearAll();
    
    const config = {
      moduleId: 'test-module'
    };
    
    ModuleRegistry.register(config);
    
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    expect(ModuleRegistry.isRegistered('non-existent')).toBe(false);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered).toBeDefined();
    expect(registered?.moduleId).toBe('test-module');
    expect(registered?.contextProvider).toBeUndefined();
    expect(registered?.errorFilter).toBeUndefined();
  });

  it('should register a module with context provider', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const contextProvider = () => ({ testKey: 'testValue', sessionId: '123' });
    
    const config = {
      moduleId: 'test-module',
      contextProvider
    };
    
    ModuleRegistry.register(config);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.contextProvider).toBe(contextProvider);
    
    const context = ModuleRegistry.getModuleContext('test-module');
    expect(context).toEqual({ testKey: 'testValue', sessionId: '123' });
    
    // Check statistics
    expect(registered?.contextCallCount).toBe(1);
    expect(registered?.lastContextCall).toBeDefined();
  });

  it('should register a module with error filter', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const errorFilter = (error: Error) => error.message.includes('ignore');
    
    const config = {
      moduleId: 'test-module',
      errorFilter
    };
    
    ModuleRegistry.register(config);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.errorFilter).toBe(errorFilter);
    
    // Test filter functionality
    const normalError = new Error('Normal error');
    const ignoredError = new Error('Please ignore this error');
    
    expect(ModuleRegistry.shouldFilterError('test-module', normalError)).toBe(false);
    expect(ModuleRegistry.shouldFilterError('test-module', ignoredError)).toBe(true);
    
    // Check statistics
    expect(registered?.filterCallCount).toBe(2);
  });

  it('should reject invalid context providers', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const invalidContextProvider = () => 'not an object';
    
    const config = {
      moduleId: 'test-module',
      contextProvider: invalidContextProvider as any
    };
    
    ModuleRegistry.register(config);
    
    // Should be registered but context provider should be disabled
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.contextProvider).toBeUndefined();
  });

  it('should handle context provider errors gracefully', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const throwingContextProvider = () => {
      throw new Error('Context provider error');
    };
    
    const config = {
      moduleId: 'test-module',
      contextProvider: throwingContextProvider
    };
    
    ModuleRegistry.register(config);
    
    // Should be registered but context provider should be disabled
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.contextProvider).toBeUndefined();
  });

  it('should reject invalid error filters', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const invalidErrorFilter = () => 'not a boolean';
    
    const config = {
      moduleId: 'test-module',
      errorFilter: invalidErrorFilter as any
    };
    
    ModuleRegistry.register(config);
    
    // Should be registered but error filter should be disabled
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.errorFilter).toBeUndefined();
  });

  it('should handle error filter errors gracefully', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const throwingErrorFilter = () => {
      throw new Error('Filter error');
    };
    
    const config = {
      moduleId: 'test-module',
      errorFilter: throwingErrorFilter
    };
    
    ModuleRegistry.register(config);
    
    // Should be registered but error filter should be disabled
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.errorFilter).toBeUndefined();
  });

  it('should register module with custom endpoint', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const endpoint = {
      name: 'Custom Endpoint',
      url: 'https://custom.example.com/report',
      enabled: true
    };
    
    const config = {
      moduleId: 'test-module',
      endpoint
    };
    
    ModuleRegistry.register(config);
    
    const registered = ModuleRegistry.getRegisteredModule('test-module');
    expect(registered?.endpoint).toEqual(endpoint);
    
    const moduleEndpoint = ModuleRegistry.getModuleEndpoint('test-module');
    expect(moduleEndpoint).toEqual(endpoint);
  });

  it('should return empty context for unregistered modules', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const context = ModuleRegistry.getModuleContext('non-existent');
    expect(context).toEqual({});
  });

  it('should not filter errors for unregistered modules', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    const error = new Error('Test error');
    const shouldFilter = ModuleRegistry.shouldFilterError('non-existent', error);
    expect(shouldFilter).toBe(false);
  });

  it('should provide accurate statistics', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    // Register module with context provider
    ModuleRegistry.register({
      moduleId: 'test-module',
      contextProvider: () => ({ test: true })
    });
    
    // Register module with error filter
    ModuleRegistry.register({
      moduleId: 'another-module',
      errorFilter: () => false
    });
    
    // Call context and filter
    ModuleRegistry.getModuleContext('test-module');
    ModuleRegistry.shouldFilterError('another-module', new Error('test'));
    
    const stats = ModuleRegistry.getStats();
    expect(stats.totalRegistered).toBe(2);
    expect(stats.modulesWithContext).toBe(1);
    expect(stats.modulesWithFilters).toBe(1);
    expect(stats.modulesWithEndpoints).toBe(0);
    expect(stats.totalContextCalls).toBe(1);
    expect(stats.totalFilterCalls).toBe(1);
  });

  it('should unregister modules', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    ModuleRegistry.register({ moduleId: 'test-module' });
    expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    
    const wasRegistered = ModuleRegistry.unregister('test-module');
    expect(wasRegistered).toBe(true);
    expect(ModuleRegistry.isRegistered('test-module')).toBe(false);
    
    const wasNotRegistered = ModuleRegistry.unregister('non-existent');
    expect(wasNotRegistered).toBe(false);
  });

  it('should clear all registrations', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    ModuleRegistry.register({ moduleId: 'test-module' });
    ModuleRegistry.register({ moduleId: 'another-module' });
    
    expect(ModuleRegistry.getStats().totalRegistered).toBe(2);
    
    ModuleRegistry.clearAll();
    expect(ModuleRegistry.getStats().totalRegistered).toBe(0);
  });

  it('should reject registration for non-existent modules', async () => {
    const { ModuleRegistry } = await import('../src/module-registry');
    ModuleRegistry.clearAll();
    
    ModuleRegistry.register({ moduleId: 'non-existent-module' });
    expect(ModuleRegistry.isRegistered('non-existent-module')).toBe(false);
  });
});