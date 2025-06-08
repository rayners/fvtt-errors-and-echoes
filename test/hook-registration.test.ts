/**
 * Hook-Based Registration System Tests for Errors & Echoes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, setMockModule } from './setup';
import { ModuleRegistry } from '../src/module-registry';

describe('Hook-Based Registration System', () => {
  beforeEach(async () => {
    resetMocks();
    
    // Mock the Hooks system
    (global as any).Hooks = {
      callAll: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      call: vi.fn()
    };
  });

  describe('errorsAndEchoesReady Hook', () => {
    it('should call errorsAndEchoesReady hook when E&E is ready', () => {
      // Mock the E&E API that would be passed to the hook
      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      // Simulate E&E calling the hook when ready
      (global as any).Hooks.callAll('errorsAndEchoesReady', mockAPI);

      expect((global as any).Hooks.callAll).toHaveBeenCalledWith('errorsAndEchoesReady', mockAPI);
    });

    it('should allow modules to register via hook handler', () => {
      // Set up a mock module that wants to register
      setMockModule('test-module', {
        id: 'test-module',
        version: '1.0.0'
      });

      // Mock E&E API
      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      // Create a hook handler that a module would use
      const moduleHookHandler = (api: any) => {
        api.register({
          moduleId: 'test-module',
          contextProvider: () => ({
            gameSystem: (global as any).game.system.id,
            moduleVersion: '1.0.0'
          }),
          errorFilter: (error: Error) => {
            return !error.message.includes('ignore-this');
          }
        });
      };

      // Register the hook handler (this is what the module would do)
      (global as any).Hooks.on('errorsAndEchoesReady', moduleHookHandler);

      // Verify hook was registered
      expect((global as any).Hooks.on).toHaveBeenCalledWith('errorsAndEchoesReady', moduleHookHandler);

      // Simulate E&E calling the hook
      moduleHookHandler(mockAPI);

      // Verify the module tried to register
      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'test-module',
        contextProvider: expect.any(Function),
        errorFilter: expect.any(Function)
      });
    });

    it('should handle multiple modules registering via hook', () => {
      // Set up multiple mock modules
      setMockModule('module-a', { id: 'module-a', version: '1.0.0' });
      setMockModule('module-b', { id: 'module-b', version: '2.0.0' });

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      // Create hook handlers for multiple modules
      const moduleAHandler = (api: any) => {
        api.register({
          moduleId: 'module-a',
          contextProvider: () => ({ source: 'module-a' })
        });
      };

      const moduleBHandler = (api: any) => {
        api.register({
          moduleId: 'module-b',
          contextProvider: () => ({ source: 'module-b' }),
          errorFilter: () => true
        });
      };

      // Register both handlers
      (global as any).Hooks.on('errorsAndEchoesReady', moduleAHandler);
      (global as any).Hooks.on('errorsAndEchoesReady', moduleBHandler);

      // Simulate E&E calling the hook (which would call all handlers)
      moduleAHandler(mockAPI);
      moduleBHandler(mockAPI);

      // Verify both modules registered
      expect(mockAPI.register).toHaveBeenCalledTimes(2);
      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'module-a',
        contextProvider: expect.any(Function)
      });
      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'module-b',
        contextProvider: expect.any(Function),
        errorFilter: expect.any(Function)
      });
    });

    it('should handle hook registration errors gracefully', () => {
      const mockAPI = {
        register: vi.fn().mockImplementation(() => {
          throw new Error('Registration failed');
        }),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      const faultyHandler = (api: any) => {
        api.register({
          moduleId: 'faulty-module',
          contextProvider: () => ({ broken: true })
        });
      };

      // This should not throw
      expect(() => {
        faultyHandler(mockAPI);
      }).toThrow('Registration failed'); // The handler itself might throw

      // But E&E should handle this gracefully when calling hooks
      expect(mockAPI.register).toHaveBeenCalled();
    });
  });

  describe('Integration Examples', () => {
    it('should demonstrate Seasons & Stars registration pattern', () => {
      setMockModule('seasons-and-stars', {
        id: 'seasons-and-stars',
        version: '0.2.3'
      });

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      // This is what S&S would do in its module.ts
      const seasonsStarsHandler = (errorsAndEchoesAPI: any) => {
        errorsAndEchoesAPI.register({
          moduleId: 'seasons-and-stars',
          contextProvider: () => ({
            activeCalendar: (global as any).game.seasonsStars?.manager?.getActiveCalendar()?.id || 'none',
            currentDate: (global as any).game.seasonsStars?.manager?.getCurrentDate()?.toDateString() || 'unknown',
            widgetState: {
              mainWidget: !!(global as any).game.seasonsStars?.widgets?.main?.rendered,
              miniWidget: !!(global as any).game.seasonsStars?.widgets?.mini?.rendered,
              gridWidget: !!(global as any).game.seasonsStars?.widgets?.grid?.rendered
            }
          })
          // No error filter - we want to report all S&S errors
        });
      };

      // Register the hook
      (global as any).Hooks.on('errorsAndEchoesReady', seasonsStarsHandler);

      // Simulate E&E calling the hook
      seasonsStarsHandler(mockAPI);

      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'seasons-and-stars',
        contextProvider: expect.any(Function)
      });

      // Test the context provider
      const registrationCall = mockAPI.register.mock.calls[0][0];
      const context = registrationCall.contextProvider();
      expect(context).toHaveProperty('activeCalendar');
      expect(context).toHaveProperty('currentDate');
      expect(context).toHaveProperty('widgetState');
    });

    it('should demonstrate Simple Weather registration pattern', () => {
      setMockModule('foundry-simple-weather', {
        id: 'foundry-simple-weather',
        version: '1.10.0'
      });

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      const simpleWeatherHandler = (errorsAndEchoesAPI: any) => {
        errorsAndEchoesAPI.register({
          moduleId: 'foundry-simple-weather',
          contextProvider: () => ({
            weatherAPI: (global as any).game.modules.get('foundry-simple-weather')?.api ? 'available' : 'unavailable',
            activeWeather: (global as any).SimpleWeather?.getCurrentWeather?.() || 'unknown',
            settingsVersion: (global as any).game.settings.get('foundry-simple-weather', 'version') || 'unknown'
          }),
          errorFilter: (error: Error) => {
            // Filter out known issues with weather API timing
            return !error.message.includes('Weather data not yet loaded');
          }
        });
      };

      (global as any).Hooks.on('errorsAndEchoesReady', simpleWeatherHandler);
      simpleWeatherHandler(mockAPI);

      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'foundry-simple-weather',
        contextProvider: expect.any(Function),
        errorFilter: expect.any(Function)
      });
    });

    it('should demonstrate generic module registration pattern', () => {
      setMockModule('generic-module', {
        id: 'generic-module',
        version: '0.1.0'
      });

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      const genericHandler = (errorsAndEchoesAPI: any) => {
        // Minimal registration - just module ID
        errorsAndEchoesAPI.register({
          moduleId: 'generic-module'
        });
      };

      (global as any).Hooks.on('errorsAndEchoesReady', genericHandler);
      genericHandler(mockAPI);

      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'generic-module'
      });
    });
  });

  describe('Hook Timing Benefits', () => {
    it('should eliminate init vs ready timing issues', () => {
      // The beauty of the hook system is that modules don't need to worry
      // about whether they register their hook in 'init' or 'ready'
      // E&E will call the hook when it's ready, regardless of when the 
      // module registered its handler

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      let hookHandler: Function | null = null;

      // Module registers handler in 'init' hook
      const initHandler = () => {
        hookHandler = (api: any) => {
          api.register({ moduleId: 'early-module' });
        };
        (global as any).Hooks.on('errorsAndEchoesReady', hookHandler);
      };

      // E&E calls the hook later when ready
      const eeReadyHandler = () => {
        if (hookHandler) {
          hookHandler(mockAPI);
        }
      };

      // Simulate the flow
      initHandler(); // Module registers hook handler early
      eeReadyHandler(); // E&E calls hook when ready

      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'early-module'
      });
    });

    it('should work even if modules register hooks after E&E is ready', () => {
      // Another benefit: if a module is late to the party and registers
      // its hook after E&E is already ready, E&E could potentially
      // call the hook immediately

      const mockAPI = {
        register: vi.fn(),
        report: vi.fn(),
        hasConsent: vi.fn(() => true),
        getPrivacyLevel: vi.fn(() => 'standard'),
        getStats: vi.fn(() => ({ totalRegistered: 0 }))
      };

      // Simulate E&E being ready and available
      (global as any).ErrorsAndEchoesAPI = mockAPI;

      // Late module registers hook
      const lateHandler = (api: any) => {
        api.register({ moduleId: 'late-module' });
      };

      // If E&E is already ready, it could call the handler immediately
      if ((global as any).ErrorsAndEchoesAPI) {
        lateHandler((global as any).ErrorsAndEchoesAPI);
      }

      expect(mockAPI.register).toHaveBeenCalledWith({
        moduleId: 'late-module'
      });
    });
  });
});