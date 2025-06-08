/**
 * Integration Examples End-to-End Tests
 * 
 * Tests that verify the integration examples work correctly
 * with the actual Registration API implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModuleRegistry } from '../src/module-registry.js';

// Mock Foundry environment for testing
const mockFoundryEnv = {
  game: {
    modules: new Map([
      ['journeys-and-jamborees', { 
        id: 'journeys-and-jamborees',
        active: true,
        version: '1.0.0'
      }],
      ['foundry-simple-weather', {
        id: 'foundry-simple-weather', 
        active: true,
        version: '2.0.0'
      }],
      ['generic-module', {
        id: 'generic-module',
        active: true, 
        version: '0.1.0'
      }]
    ]),
    system: { id: 'dnd5e', version: '2.0.0' },
    version: '11.315',
    user: { role: 4 },
    scenes: { 
      active: { 
        name: 'Test Scene',
        getFlag: vi.fn().mockReturnValue(null)
      }
    },
    actors: [],
    settings: {
      get: vi.fn().mockImplementation((module, key) => {
        const settings = {
          'journeys-and-jamborees': {
            'autoGatherFood': true,
            'showPartyHud': false
          },
          'foundry-simple-weather': {
            'autoGenerate': true,
            'climate': 'temperate',
            'useSeasons': false
          },
          'generic-module': {
            'important-setting': 'test-value',
            'debug-mode': true
          }
        };
        return settings[module]?.[key];
      })
    }
  },
  console: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  window: {} as any
};

// Set up global environment
Object.assign(globalThis, mockFoundryEnv);

describe('Integration Examples', () => {
  beforeEach(() => {
    // Clear registry between tests
    ModuleRegistry.clearAll();
    
    // Set up test modules in the mock modules collection
    const testModules = new Map();
    testModules.set('journeys-and-jamborees', {
      id: 'journeys-and-jamborees',
      title: 'Test Travel Module',
      version: '1.0.0',
      active: true
    });
    testModules.set('test-weather-module', {
      id: 'test-weather-module',
      title: 'Test Weather Module',
      version: '1.0.0',
      active: true,
      authors: [{ name: 'Test Author', email: 'test@example.com' }]
    });
    testModules.set('foundry-simple-weather', {
      id: 'foundry-simple-weather',
      title: 'Test Weather System',
      version: '1.0.0',
      active: true,
      authors: [{ name: 'Test Author', email: 'test@example.com' }]
    });
    testModules.set('generic-module', {
      id: 'generic-module',
      title: 'Generic Test Module',
      version: '0.1.0',
      active: true
    });
    
    // Add contents property to make it compatible with Foundry's Collection interface
    (testModules as any).contents = Array.from(testModules.values());
    mockFoundryEnv.game.modules = testModules;
    
    // Set up ErrorsAndEchoesAPI
    mockFoundryEnv.window.ErrorsAndEchoesAPI = {
      register: ModuleRegistry.register.bind(ModuleRegistry),
      reportError: vi.fn()
    };
  });

  afterEach(() => {
    ModuleRegistry.clearAll();
    vi.clearAllMocks();
  });

  describe('Journeys and Jamborees Integration', () => {
    it('should register successfully with context provider', () => {
      // Simulate the integration code
      const registration = {
        moduleId: 'journeys-and-jamborees',
        contextProvider: () => {
          const context = {} as any;
          
          // Simulate party detection
          if (mockFoundryEnv.game.actors) {
            const partyActors = mockFoundryEnv.game.actors.filter((a: any) => a.type === 'party');
            context.partyCount = partyActors.length;
          }
          
          // Add scene travel information
          if (mockFoundryEnv.game.scenes?.active) {
            const scene = mockFoundryEnv.game.scenes.active;
            const travelData = scene.getFlag('journeys-and-jamborees', 'travel');
            if (travelData) {
              context.sceneHasTravelData = true;
              context.travelMode = travelData.mode;
            }
          }
          
          // Add system information
          context.gameSystem = mockFoundryEnv.game.system.id;
          context.systemVersion = mockFoundryEnv.game.system.version;
          
          // Add settings
          try {
            context.autoGatherFood = mockFoundryEnv.game.settings.get('journeys-and-jamborees', 'autoGatherFood');
            context.partyHudEnabled = mockFoundryEnv.game.settings.get('journeys-and-jamborees', 'showPartyHud');
          } catch (e) {
            context.settingsError = 'Could not read module settings';
          }
          
          return context;
        },
        errorFilter: (error: Error) => {
          const stack = error.stack || '';
          const message = error.message || '';
          
          // Report J&J related errors
          if (stack.includes('journeys-and-jamborees') || 
              message.includes('party')) {
            return false; // Don't filter
          }
          
          // Filter out unrelated errors
          return true;
        }
      };

      // Register the module
      ModuleRegistry.register(registration);

      // Verify registration succeeded
      expect(ModuleRegistry.isRegistered('journeys-and-jamborees')).toBe(true);
      
      const registered = ModuleRegistry.getRegisteredModule('journeys-and-jamborees');
      expect(registered).toBeDefined();
      expect(registered?.moduleId).toBe('journeys-and-jamborees');
    });

    it('should provide correct context data', () => {
      // Register with context provider
      ModuleRegistry.register({
        moduleId: 'journeys-and-jamborees',
        contextProvider: () => ({
          gameSystem: mockFoundryEnv.game.system.id,
          systemVersion: mockFoundryEnv.game.system.version,
          autoGatherFood: mockFoundryEnv.game.settings.get('journeys-and-jamborees', 'autoGatherFood'),
          partyHudEnabled: mockFoundryEnv.game.settings.get('journeys-and-jamborees', 'showPartyHud')
        })
      });

      // Get context
      const context = ModuleRegistry.getModuleContext('journeys-and-jamborees');

      expect(context).toEqual({
        gameSystem: 'dnd5e',
        systemVersion: '2.0.0',
        autoGatherFood: true,
        partyHudEnabled: false
      });
    });

    it('should filter errors correctly', () => {
      // Register with error filter
      ModuleRegistry.register({
        moduleId: 'journeys-and-jamborees',
        errorFilter: (error: Error) => {
          const stack = error.stack || '';
          const message = error.message || '';
          
          // Report J&J related errors
          if (stack.includes('journeys-and-jamborees') || 
              message.includes('party')) {
            return false; // Don't filter
          }
          
          // Filter out unrelated errors
          return true;
        }
      });

      // Test filtering of J&J related errors
      const jjError = new Error('Party management failed');
      jjError.stack = 'Error: Party management failed\n    at journeys-and-jamborees/party.js:123';
      expect(ModuleRegistry.shouldFilterError('journeys-and-jamborees', jjError)).toBe(false);

      const partyError = new Error('Invalid party configuration');
      expect(ModuleRegistry.shouldFilterError('journeys-and-jamborees', partyError)).toBe(false);

      // Test filtering of unrelated errors
      const unrelatedError = new Error('Dice so Nice animation failed');
      unrelatedError.stack = 'Error: Animation failed\n    at dice-so-nice/animation.js:456';
      expect(ModuleRegistry.shouldFilterError('journeys-and-jamborees', unrelatedError)).toBe(true);
    });
  });

  describe('Simple Weather Integration', () => {
    it('should register successfully with weather context', () => {
      // Mock Simple Weather API
      mockFoundryEnv.window.SimpleWeather = {
        getCurrentWeather: () => ({
          type: 'rain',
          intensity: 'heavy',
          temperature: 15,
          effects: ['rain-sound', 'rain-visual']
        }),
        getSettings: () => ({
          autoGenerate: true,
          climate: 'temperate',
          useSeasons: false
        })
      };

      const registration = {
        moduleId: 'foundry-simple-weather',
        contextProvider: () => {
          const context = {} as any;
          
          if (mockFoundryEnv.window.SimpleWeather) {
            const currentWeather = mockFoundryEnv.window.SimpleWeather.getCurrentWeather();
            if (currentWeather) {
              context.currentWeather = {
                type: currentWeather.type,
                intensity: currentWeather.intensity,
                temperature: currentWeather.temperature,
                hasEffects: currentWeather.effects?.length > 0
              };
            }
            
            context.weatherGeneration = {
              autoGenerate: mockFoundryEnv.window.SimpleWeather.getSettings().autoGenerate,
              climateType: mockFoundryEnv.window.SimpleWeather.getSettings().climate,
              seasonalEffects: mockFoundryEnv.window.SimpleWeather.getSettings().useSeasons
            };
          }
          
          // Calendar integration
          const calendarModules = ['foundryvtt-simple-calendar', 'about-time', 'smalltime'];
          context.calendarIntegration = {
            available: calendarModules.some(id => mockFoundryEnv.game.modules.get(id)?.active),
            activeCalendar: calendarModules.find(id => mockFoundryEnv.game.modules.get(id)?.active) || 'none'
          };
          
          return context;
        },
        errorFilter: (error: Error) => {
          const stack = error.stack || '';
          const message = error.message || '';
          
          // Report weather-related errors
          if (stack.includes('foundry-simple-weather') || 
              message.includes('weather') ||
              message.includes('WeatherEffects')) {
            return false;
          }
          
          return !message.toLowerCase().includes('weather');
        }
      };

      ModuleRegistry.register(registration);

      expect(ModuleRegistry.isRegistered('foundry-simple-weather')).toBe(true);
      
      const context = ModuleRegistry.getModuleContext('foundry-simple-weather');
      expect(context.currentWeather).toEqual({
        type: 'rain',
        intensity: 'heavy', 
        temperature: 15,
        hasEffects: true
      });
      expect(context.weatherGeneration.autoGenerate).toBe(true);
      expect(context.calendarIntegration.available).toBe(false);
    });

    it('should handle missing weather API gracefully', () => {
      // Clear the SimpleWeather API for this test
      delete mockFoundryEnv.window.SimpleWeather;
      
      // Register without SimpleWeather API available
      ModuleRegistry.register({
        moduleId: 'foundry-simple-weather',
        contextProvider: () => {
          const context = {} as any;
          
          try {
            if (mockFoundryEnv.window.SimpleWeather) {
              context.weatherAPI = 'available';
            } else {
              context.weatherAPI = 'unavailable';
            }
          } catch (e) {
            context.weatherAPIError = (e as Error).message;
          }
          
          return context;
        }
      });

      const context = ModuleRegistry.getModuleContext('foundry-simple-weather');
      expect(context.weatherAPI).toBe('unavailable');
    });
  });

  describe('Generic Module Integration', () => {
    it('should work with minimal configuration', () => {
      // Test minimal registration
      ModuleRegistry.register({
        moduleId: 'generic-module'
      });

      expect(ModuleRegistry.isRegistered('generic-module')).toBe(true);
      
      const registered = ModuleRegistry.getRegisteredModule('generic-module');
      expect(registered?.contextProvider).toBeUndefined();
      expect(registered?.errorFilter).toBeUndefined();
    });

    it('should work with full configuration', () => {
      ModuleRegistry.register({
        moduleId: 'generic-module',
        contextProvider: () => ({
          moduleVersion: mockFoundryEnv.game.modules.get('generic-module')?.version,
          isActive: true,
          gameSystem: mockFoundryEnv.game.system.id,
          activeScene: mockFoundryEnv.game.scenes?.active?.name,
          userRole: mockFoundryEnv.game.user.role,
          debugMode: mockFoundryEnv.game.settings.get('generic-module', 'debug-mode')
        }),
        errorFilter: (error: Error) => {
          const stack = error.stack || '';
          return !stack.includes('generic-module');
        }
      });

      const context = ModuleRegistry.getModuleContext('generic-module');
      expect(context).toEqual({
        moduleVersion: '0.1.0',
        isActive: true,
        gameSystem: 'dnd5e',
        activeScene: 'Test Scene',
        userRole: 4,
        debugMode: true
      });

      // Test error filtering
      const moduleError = new Error('Generic module failed');
      moduleError.stack = 'Error: Failed\n    at generic-module/main.js:100';
      expect(ModuleRegistry.shouldFilterError('generic-module', moduleError)).toBe(false);

      const otherError = new Error('Other module failed'); 
      otherError.stack = 'Error: Failed\n    at other-module/main.js:100';
      expect(ModuleRegistry.shouldFilterError('generic-module', otherError)).toBe(true);
    });
  });

  describe('Registration Statistics', () => {
    it('should track registration statistics correctly', () => {
      // Register multiple modules with different configurations
      ModuleRegistry.register({
        moduleId: 'journeys-and-jamborees',
        contextProvider: () => ({ test: true }),
        errorFilter: () => false
      });

      ModuleRegistry.register({
        moduleId: 'foundry-simple-weather',
        contextProvider: () => ({ weather: true })
      });

      ModuleRegistry.register({
        moduleId: 'generic-module'
      });

      const stats = ModuleRegistry.getStats();
      expect(stats.totalRegistered).toBe(3);
      expect(stats.modulesWithContext).toBe(2);
      expect(stats.modulesWithFilters).toBe(1);
      expect(stats.modulesWithEndpoints).toBe(0);
    });

    it('should track context and filter call counts', () => {
      // Add test module to mock game modules
      mockFoundryEnv.game.modules.set('test-module', {
        id: 'test-module',
        active: true,
        version: '1.0.0'
      });
      
      ModuleRegistry.register({
        moduleId: 'test-module',
        contextProvider: () => ({ call: Date.now() }),
        errorFilter: () => false
      });

      // Call context provider multiple times
      ModuleRegistry.getModuleContext('test-module');
      ModuleRegistry.getModuleContext('test-module');
      ModuleRegistry.getModuleContext('test-module');

      // Call error filter multiple times
      const testError = new Error('Test');
      ModuleRegistry.shouldFilterError('test-module', testError);
      ModuleRegistry.shouldFilterError('test-module', testError);

      const registered = ModuleRegistry.getRegisteredModule('test-module');
      expect(registered?.contextCallCount).toBe(3);
      expect(registered?.filterCallCount).toBe(2);

      const stats = ModuleRegistry.getStats();
      expect(stats.totalContextCalls).toBe(3);
      expect(stats.totalFilterCalls).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle context provider errors gracefully', () => {
      ModuleRegistry.register({
        moduleId: 'error-prone-module',
        contextProvider: () => {
          throw new Error('Context provider failed');
        }
      });

      // Should not throw and should return empty context
      const context = ModuleRegistry.getModuleContext('error-prone-module');
      expect(context).toEqual({});
    });

    it('should handle error filter errors gracefully', () => {
      ModuleRegistry.register({
        moduleId: 'filter-error-module',
        errorFilter: () => {
          throw new Error('Filter failed');
        }
      });

      const testError = new Error('Test error');
      
      // Should not throw and should default to not filtering
      const shouldFilter = ModuleRegistry.shouldFilterError('filter-error-module', testError);
      expect(shouldFilter).toBe(false);
    });
  });
});