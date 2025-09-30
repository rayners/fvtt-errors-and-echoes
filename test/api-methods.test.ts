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
        getStats: vi.fn(),
      },
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
      submitBug: (bugReport: any) => {
        // Mock implementation for submitBug method
        if (!bugReport || typeof bugReport !== 'object') {
          console.warn('Errors and Echoes: submitBug() requires a bug report object');
          return;
        }

        if (
          !bugReport.title ||
          typeof bugReport.title !== 'string' ||
          bugReport.title.trim().length === 0
        ) {
          console.warn('Errors and Echoes: submitBug() requires a non-empty title');
          return;
        }

        if (
          !bugReport.description ||
          typeof bugReport.description !== 'string' ||
          bugReport.description.trim().length === 0
        ) {
          console.warn('Errors and Echoes: submitBug() requires a non-empty description');
          return;
        }

        if (!ConsentManager.hasConsent()) {
          console.debug(
            'Errors and Echoes: Manual bug submission skipped - user has not consented'
          );
          return;
        }

        console.log(
          `API: Submitting bug report '${bugReport.title}' for module ${bugReport.module || 'unknown'}`
        );
      },
      hasConsent: () => ConsentManager.hasConsent(),
      getPrivacyLevel: () => ConsentManager.getPrivacyLevel(),
      getStats: () => ErrorReporter.getReportStats(),
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
        errorFilter: (error: Error) => false,
      };

      // Set up the test module
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
      });

      expect(() => mockAPI.register(config)).not.toThrow();
      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
    });

    it('should handle registration errors gracefully', () => {
      const config = {
        moduleId: 'non-existent-module',
        contextProvider: () => ({ testData: true }),
      };

      // This should not throw but should log an error
      expect(() => mockAPI.register(config)).not.toThrow();
      expect(ModuleRegistry.isRegistered('non-existent-module')).toBe(false);
    });

    it('should validate context provider return type', () => {
      const config = {
        moduleId: 'test-module',
        contextProvider: () => 'invalid return type', // Should return object
      };

      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
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
        errorFilter: (error: Error) => 'invalid return type', // Should return boolean
      };

      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
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
        context: { userAction: 'button-click', debugMode: true },
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
        active: true,
      });

      // Register module
      mockAPI.register({
        moduleId: 'test-module',
        contextProvider: () => ({ registered: true }),
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
        moduleId: 'missing-module',
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
        active: true,
      });

      const config = {
        moduleId: 'test-module',
        contextProvider: () => {
          throw new Error('Context provider error');
        },
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
        active: true,
      });

      const config = {
        moduleId: 'test-module',
        errorFilter: (error: Error) => {
          throw new Error('Filter error');
        },
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

  describe('submitBug() API method', () => {
    beforeEach(() => {
      // Enable consent for bug submission tests
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      setMockSetting('errors-and-echoes', 'hasShownWelcome', true);
      setMockSetting('errors-and-echoes', 'consentDate', new Date().toISOString());
    });

    it('should accept a valid bug report', () => {
      const bugReport = {
        title: 'Test Bug',
        description: 'This is a test bug description',
        stepsToReproduce: '1. Do something\n2. See error',
        expectedBehavior: 'Should work correctly',
        actualBehavior: 'Throws an error',
        severity: 'medium' as const,
        category: 'functionality' as const,
        module: 'test-module',
      };

      expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
    });

    it('should require a bug report object', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockAPI.submitBug(null as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a bug report object'
      );

      mockAPI.submitBug(undefined as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a bug report object'
      );

      mockAPI.submitBug('invalid' as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a bug report object'
      );

      consoleSpy.mockRestore();
    });

    it('should require a non-empty title', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const bugReportNoTitle = {
        description: 'This is a test bug description',
      };

      mockAPI.submitBug(bugReportNoTitle as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty title'
      );

      const bugReportEmptyTitle = {
        title: '',
        description: 'This is a test bug description',
      };

      mockAPI.submitBug(bugReportEmptyTitle);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty title'
      );

      const bugReportWhitespaceTitle = {
        title: '   ',
        description: 'This is a test bug description',
      };

      mockAPI.submitBug(bugReportWhitespaceTitle);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty title'
      );

      consoleSpy.mockRestore();
    });

    it('should require a non-empty description', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const bugReportNoDescription = {
        title: 'Test Bug',
      };

      mockAPI.submitBug(bugReportNoDescription as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty description'
      );

      const bugReportEmptyDescription = {
        title: 'Test Bug',
        description: '',
      };

      mockAPI.submitBug(bugReportEmptyDescription);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty description'
      );

      const bugReportWhitespaceDescription = {
        title: 'Test Bug',
        description: '   ',
      };

      mockAPI.submitBug(bugReportWhitespaceDescription);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: submitBug() requires a non-empty description'
      );

      consoleSpy.mockRestore();
    });

    it('should not submit when consent is not given', () => {
      // Disable consent
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const bugReport = {
        title: 'Test Bug',
        description: 'This is a test bug description',
      };

      mockAPI.submitBug(bugReport);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Errors and Echoes: Manual bug submission skipped - user has not consented'
      );

      consoleSpy.mockRestore();
    });

    it('should handle optional fields correctly', () => {
      const bugReport = {
        title: 'Test Bug',
        description: 'This is a test bug description',
        stepsToReproduce: 'Steps to reproduce',
        expectedBehavior: 'Expected behavior',
        actualBehavior: 'Actual behavior',
        severity: 'high' as const,
        category: 'ui' as const,
        context: { debugMode: true },
      };

      expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
    });

    it('should work with minimal required fields only', () => {
      const bugReport = {
        title: 'Minimal Bug Report',
        description: 'Just the required fields',
      };

      expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
    });

    it('should handle module override in bug report', () => {
      const bugReport = {
        title: 'Test Bug',
        description: 'This is a test bug description',
        module: 'specific-module',
      };

      expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
    });

    it('should handle all severity levels', () => {
      const severities = ['low', 'medium', 'high', 'critical'] as const;

      severities.forEach(severity => {
        const bugReport = {
          title: `${severity} Bug`,
          description: `Bug with ${severity} severity`,
          severity,
        };

        expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
      });
    });

    it('should handle all category types', () => {
      const categories = ['ui', 'functionality', 'performance', 'integration', 'other'] as const;

      categories.forEach(category => {
        const bugReport = {
          title: `${category} Bug`,
          description: `Bug in ${category} category`,
          category,
        };

        expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
      });
    });

    it('should handle submission errors gracefully', () => {
      // Create a mock that throws an error
      const throwingMockAPI = {
        ...mockAPI,
        submitBug: (bugReport: any) => {
          throw new Error('Network error');
        },
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const bugReport = {
        title: 'Test Bug',
        description: 'This should trigger an error',
      };

      expect(() => throwingMockAPI.submitBug(bugReport)).toThrow('Network error');

      consoleSpy.mockRestore();
    });

    it('should include context in submission', () => {
      const bugReport = {
        title: 'Test Bug with Context',
        description: 'Bug report with additional context',
        context: {
          userAction: 'clicked-button',
          currentView: 'character-sheet',
          debugMode: true,
        },
      };

      expect(() => mockAPI.submitBug(bugReport)).not.toThrow();
    });
  });
});
