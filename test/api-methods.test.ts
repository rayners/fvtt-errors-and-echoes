/**
 * Tests for Errors & Echoes Public API Methods
 * 
 * Tests the public API that other modules use to interact with E&E.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMocks, resetMocks, setMockSetting, setMockModule } from './setup.js';
import { ModuleRegistry } from '../src/module-registry.js';
import { ConsentManager } from '../src/consent-manager.js';
import { ErrorReporter } from '../src/error-reporter.js';

describe('Errors & Echoes API Methods', () => {
  let mockAPI: any;

  beforeEach(() => {
    setupMocks();
    resetMocks();
    
    // Set up a test module for E&E with API
    const mockErrorsAndEchoesModule = {
      id: 'errors-and-echoes',
      title: 'Errors and Echoes',
      version: '0.1.0',
      active: true,
      api: {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(),
        getPrivacyLevel: vi.fn(),
        getStats: vi.fn()
      }
    };
    
    setMockModule('errors-and-echoes', mockErrorsAndEchoesModule);
    
    // Create a real API instance that delegates to our mocks
    mockAPI = {
      register: (config: any) => ModuleRegistry.register(config),
      report: (error: Error, options: any = {}) => {
        // Mock implementation of report method
        if (!error || !ConsentManager.hasConsent()) return;
        
        const moduleId = options.module || 'unknown';
        console.log(`API: Reporting error for module ${moduleId}:`, error.message);
      },
      hasConsent: () => ConsentManager.hasConsent(),
      getPrivacyLevel: () => ConsentManager.getPrivacyLevel(),
      getStats: () => ErrorReporter.getReportStats()
    };
    
    // Set up global API access
    (global as any).game.modules.get('errors-and-echoes').api = mockAPI;
    (global as any).ErrorsAndEchoesAPI = mockAPI;
  });

  afterEach(() => {
    ModuleRegistry.clearAll();
    vi.clearAllMocks();
  });

  describe('register() API method', () => {
    it('should register a module successfully', () => {
      const config = {
        moduleId: 'test-module',
        contextProvider: () => ({ testData: true }),
        errorFilter: (error: Error) => false
      };

      // Set up the test module
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      expect(() => mockAPI.register(config)).not.toThrow();
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    });

    it('should handle registration errors gracefully', () => {
      const config = {
        moduleId: 'non-existent-module',
        contextProvider: () => ({ testData: true })
      };

      // This should not throw but should log an error
      expect(() => mockAPI.register(config)).not.toThrow();
      expect(ModuleRegistry.isRegistered('non-existent-module')).toBe(false);
    });

    it('should validate context provider return type', () => {
      const config = {
        moduleId: 'test-module',
        contextProvider: () => "invalid return type" // Should return object
      };

      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      expect(() => mockAPI.register(config)).not.toThrow();
      // Registration should succeed but context provider should be disabled
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
      
      // Verify that the context provider was disabled (not returned in context)
      const registered = ModuleRegistry.getRegisteredModule('test-module');
      expect(registered?.contextProvider).toBeUndefined();
    });

    it('should validate error filter return type', () => {
      const config = {
        moduleId: 'test-module',
        errorFilter: (error: Error) => "invalid return type" // Should return boolean
      };

      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      expect(() => mockAPI.register(config)).not.toThrow();
      // Registration should succeed but error filter should be disabled
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
      
      // Verify that the error filter was disabled
      const registered = ModuleRegistry.getRegisteredModule('test-module');
      expect(registered?.errorFilter).toBeUndefined();
    });
  });

  describe('report() API method', () => {
    beforeEach(() => {
      // Enable consent for reporting tests
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'hasShownWelcome', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());
    });

    it('should report errors when consent is given', () => {
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockAPI.report(error, { module: 'test-module' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API: Reporting error for module test-module:'),
        'Test error'
      );

      consoleSpy.mockRestore();
    });

    it('should not report errors when consent is not given', () => {
      // Disable consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockAPI.report(error, { module: 'test-module' });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing module option', () => {
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockAPI.report(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API: Reporting error for module unknown:'),
        'Test error'
      );

      consoleSpy.mockRestore();
    });

    it('should handle context in report options', () => {
      const error = new Error('Test error with context');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockAPI.report(error, { 
        module: 'test-module',
        context: { userAction: 'button-click', debugMode: true }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API: Reporting error for module test-module:'),
        'Test error with context'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('hasConsent() API method', () => {
    it('should return true when user has given consent', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());

      expect(mockAPI.hasConsent()).toBe(true);
    });

    it('should return false when global is disabled', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      expect(mockAPI.hasConsent()).toBe(false);
    });

    it('should return false when global setting is undefined', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', undefined);

      expect(mockAPI.hasConsent()).toBe(false);
    });

    it('should return false when global setting is null', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', null);

      expect(mockAPI.hasConsent()).toBe(false);
    });
  });

  describe('getPrivacyLevel() API method', () => {
    it('should return the current privacy level', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');

      expect(mockAPI.getPrivacyLevel()).toBe('standard');
    });

    it('should return minimal privacy level', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'minimal');

      expect(mockAPI.getPrivacyLevel()).toBe('minimal');
    });

    it('should return detailed privacy level', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'detailed');

      expect(mockAPI.getPrivacyLevel()).toBe('detailed');
    });

    it('should handle missing privacy level setting', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', undefined);

      // Should return default (standard)
      expect(mockAPI.getPrivacyLevel()).toBe('standard');
    });
  });

  describe('getStats() API method', () => {
    it('should return error reporting statistics', () => {
      const stats = mockAPI.getStats();

      expect(stats).toHaveProperty('totalReports');
      expect(stats).toHaveProperty('recentReports');
      expect(typeof stats.totalReports).toBe('number');
      expect(typeof stats.recentReports).toBe('number');
    });

    it('should return statistics with optional lastReportTime', () => {
      const stats = mockAPI.getStats();

      expect(stats).toHaveProperty('totalReports');
      expect(stats).toHaveProperty('recentReports');
      // lastReportTime is optional and may be undefined
      if (stats.lastReportTime) {
        expect(typeof stats.lastReportTime).toBe('string');
      }
    });

    it('should return consistent statistics format', () => {
      const stats1 = mockAPI.getStats();
      const stats2 = mockAPI.getStats();

      // Structure should be consistent
      expect(Object.keys(stats1).sort()).toEqual(Object.keys(stats2).sort());
    });
  });

  describe('API Integration Tests', () => {
    it('should allow chaining API calls', () => {
      // Enable consent
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());
      setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');

      // Set up test module
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      // Register module
      mockAPI.register({
        moduleId: 'test-module',
        contextProvider: () => ({ registered: true })
      });

      // Check registration
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);

      // Check consent
      expect(mockAPI.hasConsent()).toBe(true);

      // Check privacy level
      expect(mockAPI.getPrivacyLevel()).toBe('standard');

      // Get stats
      const stats = mockAPI.getStats();
      expect(stats).toHaveProperty('totalReports');
    });

    it('should handle API calls without consent', () => {
      // Disable consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      expect(mockAPI.hasConsent()).toBe(false);
      expect(mockAPI.getPrivacyLevel()).toBe('standard'); // Should still work
      expect(mockAPI.getStats()).toHaveProperty('totalReports'); // Should still work

      // Report should be silently ignored
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockAPI.report(new Error('Test'));
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle API calls with missing module data', () => {
      const config = {
        moduleId: 'missing-module'
      };

      // Should not throw
      expect(() => mockAPI.register(config)).not.toThrow();
      expect(ModuleRegistry.isRegistered('missing-module')).toBe(false);
    });
  });

  describe('API Error Handling', () => {
    it('should handle errors in context provider during registration', () => {
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      const config = {
        moduleId: 'test-module',
        contextProvider: () => {
          throw new Error('Context provider error');
        }
      };

      expect(() => mockAPI.register(config)).not.toThrow();
      // Registration should succeed but context provider should be disabled
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
      
      const registered = ModuleRegistry.getRegisteredModule('test-module');
      expect(registered?.contextProvider).toBeUndefined();
    });

    it('should handle errors in error filter during registration', () => {
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true
      });

      const config = {
        moduleId: 'test-module',
        errorFilter: (error: Error) => {
          throw new Error('Filter error');
        }
      };

      expect(() => mockAPI.register(config)).not.toThrow();
      // Registration should succeed but error filter should be disabled
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
      
      const registered = ModuleRegistry.getRegisteredModule('test-module');
      expect(registered?.errorFilter).toBeUndefined();
    });

    it('should handle null/undefined errors in report', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());

      // Should not throw with null error
      expect(() => mockAPI.report(null)).not.toThrow();
      expect(() => mockAPI.report(undefined)).not.toThrow();
    });
  });
});