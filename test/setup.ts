/**
 * Test setup for Errors & Echoes
 *
 * This file sets up the Foundry VTT mocking environment for testing
 * E&E components in isolation.
 */

import { vi } from 'vitest';
import { setupFoundryMocks } from '@rayners/foundry-test-utils/mocks/foundry-mocks';

// Import the components we want to test
import { ModuleRegistry } from '../src/module-registry.js';

// Create a mock modules collection that has both Map interface and contents property
class MockModulesCollection extends Map {
  get contents() {
    return Array.from(this.values());
  }
}

// Set up global mocks
const mockGame = {
  settings: {
    get: vi.fn(),
    set: vi.fn(),
    register: vi.fn(),
  },
  modules: new MockModulesCollection(),
  user: {
    isGM: true,
    id: 'test-user-id',
    name: 'Test User',
  },
  system: {
    id: 'dnd5e',
    version: '2.0.0',
  },
  scenes: {
    active: {
      name: 'Test Scene',
    },
  },
};

const mockUI = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

// Store original values for restoration
let originalGlobal = {};

export function setupMocks() {
  // Set up basic Foundry mocks from our test utils
  setupFoundryMocks();

  // Add console.debug polyfill if it doesn't exist (Node.js compatibility)
  if (!console.debug) {
    console.debug = console.log;
  }

  // Store originals
  originalGlobal = {
    game: (global as any).game,
    ui: (global as any).ui,
  };

  // Override with our specific mocks, preserving version from foundry-test-utils
  (global as any).game = {
    ...(global as any).game,
    ...mockGame,
    version: (global as any).game?.version || '13.331', // Preserve version from foundry-test-utils
  };
  (global as any).ui = {
    ...(global as any).ui,
    ...mockUI,
  };

  // Clear any existing registrations
  ModuleRegistry.clearAll();
}

export function resetMocks() {
  // Reset all mocked functions
  vi.clearAllMocks();

  // Reset module registry
  ModuleRegistry.clearAll();

  // Clear settings storage
  mockSettingsStorage.clear();

  // Reset game settings mock responses
  mockGame.settings.get.mockImplementation((module: string, key: string) => {
    // Default settings values
    const defaults = {
      'errors-and-echoes': {
        globalEnabled: false,
        privacyLevel: 'standard',
        endpoints: [],
        endpointConsent: {},
        hasShownWelcome: false,
        consentDate: null,
      },
    };
    return defaults[module]?.[key];
  });

  // Set up the set method to update storage
  mockGame.settings.set.mockImplementation(async (module: string, key: string, value: any) => {
    if (!mockSettingsStorage.has(module)) {
      mockSettingsStorage.set(module, new Map());
    }
    mockSettingsStorage.get(module)!.set(key, value);
    return Promise.resolve();
  });

  // Reset modules map
  mockGame.modules.clear();
}

export function teardownMocks() {
  // Restore original globals
  (global as any).game = originalGlobal.game;
  (global as any).ui = originalGlobal.ui;
}

// Storage for custom setting values
const mockSettingsStorage = new Map<string, Map<string, any>>();

export function setMockSetting(module: string, key: string, value: any) {
  if (!mockSettingsStorage.has(module)) {
    mockSettingsStorage.set(module, new Map());
  }
  mockSettingsStorage.get(module)!.set(key, value);

  // Update the mock implementation to use the storage
  mockGame.settings.get.mockImplementation((mod: string, k: string) => {
    // Check if we have a custom value stored
    if (mockSettingsStorage.has(mod) && mockSettingsStorage.get(mod)!.has(k)) {
      return mockSettingsStorage.get(mod)!.get(k);
    }

    // Return defaults for other settings
    const defaults = {
      'errors-and-echoes': {
        globalEnabled: false,
        privacyLevel: 'standard',
        endpoints: [],
        endpointConsent: {},
        hasShownWelcome: false,
        consentDate: null,
      },
    };
    return defaults[mod]?.[k];
  });

  // Update the set mock to use the storage
  mockGame.settings.set.mockImplementation(async (mod: string, k: string, val: any) => {
    if (!mockSettingsStorage.has(mod)) {
      mockSettingsStorage.set(mod, new Map());
    }
    mockSettingsStorage.get(mod)!.set(k, val);
    return Promise.resolve();
  });
}

export function setMockModule(moduleId: string, moduleData: any) {
  const mockModule = {
    id: moduleId,
    active: true,
    ...moduleData,
  };
  mockGame.modules.set(moduleId, mockModule);
}

export function getMockGame() {
  return mockGame;
}

export function getMockUI() {
  return mockUI;
}

// Auto-setup for tests
setupMocks();
