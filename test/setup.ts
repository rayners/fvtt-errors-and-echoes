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
    name: 'Test User'
  },
  system: {
    id: 'dnd5e',
    version: '2.0.0'
  },
  version: '11.315',
  scenes: {
    active: {
      name: 'Test Scene'
    }
  }
};

const mockUI = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
};

// Store original values for restoration
let originalGlobal = {};

export function setupMocks() {
  // Set up basic Foundry mocks from our test utils
  setupFoundryMocks();
  
  // Store originals
  originalGlobal = {
    game: (global as any).game,
    ui: (global as any).ui
  };
  
  // Override with our specific mocks
  (global as any).game = {
    ...(global as any).game,
    ...mockGame
  };
  (global as any).ui = {
    ...(global as any).ui,
    ...mockUI
  };
  
  // Clear any existing registrations
  ModuleRegistry.clearAll();
}

export function resetMocks() {
  // Reset all mocked functions
  vi.clearAllMocks();
  
  // Reset module registry
  ModuleRegistry.clearAll();
  
  // Reset game settings mock responses
  mockGame.settings.get.mockImplementation((module: string, key: string) => {
    // Default settings values
    const defaults = {
      'errors-and-echoes': {
        'globalEnabled': true,
        'privacyLevel': 'standard',
        'endpoints': [],
        'endpointConsent': {}
      }
    };
    return defaults[module]?.[key];
  });
  
  // Reset modules map
  mockGame.modules.clear();
}

export function teardownMocks() {
  // Restore original globals
  (global as any).game = originalGlobal.game;
  (global as any).ui = originalGlobal.ui;
}

export function setMockSetting(module: string, key: string, value: any) {
  mockGame.settings.get.mockImplementation((mod: string, k: string) => {
    if (mod === module && k === key) {
      return value;
    }
    // Return defaults for other settings
    const defaults = {
      'errors-and-echoes': {
        'globalEnabled': true,
        'privacyLevel': 'standard',
        'endpoints': [],
        'endpointConsent': {}
      }
    };
    return defaults[mod]?.[k];
  });
}

export function setMockModule(moduleId: string, moduleData: any) {
  const mockModule = {
    id: moduleId,
    active: true,
    ...moduleData
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