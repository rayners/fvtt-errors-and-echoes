/**
 * Test setup file for Vitest
 * Provides mock Foundry VTT environment for testing
 * 
 * This file is used to test our CI automation pipeline
 */

import { vi } from 'vitest';

// Mock global Foundry objects
const mockSettings = new Map();
const mockModules = new Map();

// Mock game object
global.game = {
  version: '12.0.0',
  system: {
    id: 'test-system',
    version: '1.0.0'
  },
  modules: {
    get: vi.fn((id: string) => mockModules.get(id)),
    contents: []
  },
  settings: {
    register: vi.fn((namespace: string, key: string, options: any) => {
      mockSettings.set(`${namespace}.${key}`, options);
    }),
    get: vi.fn((namespace: string, key: string) => {
      const setting = mockSettings.get(`${namespace}.${key}`);
      return setting?.default;
    }),
    set: vi.fn((namespace: string, key: string, value: any) => {
      const setting = mockSettings.get(`${namespace}.${key}`);
      if (setting) {
        setting.value = value;
      }
    }),
    registerMenu: vi.fn()
  },
  i18n: {
    localize: vi.fn((key: string) => key)
  }
} as any;

// Mock canvas object
global.canvas = {
  scene: {
    name: 'Test Scene'
  }
} as any;

// Mock ui object
global.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
} as any;

// Mock Hooks
global.Hooks = {
  once: vi.fn(),
  on: vi.fn(),
  call: vi.fn(),
  callAll: vi.fn()
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock console to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser) Chrome/100.0.0.0'
} as any;

// Mock btoa for stack signatures
global.btoa = vi.fn((str: string) => Buffer.from(str).toString('base64'));

// Helper functions for tests
export function resetMocks() {
  vi.clearAllMocks();
  mockSettings.clear();
  mockModules.clear();
  localStorageMock.getItem.mockReturnValue(null);
}

export function setMockModule(id: string, data: any) {
  mockModules.set(id, data);
}

export function setMockSetting(namespace: string, key: string, value: any) {
  const setting = mockSettings.get(`${namespace}.${key}`);
  if (setting) {
    setting.value = value;
  } else {
    mockSettings.set(`${namespace}.${key}`, { default: value, value });
  }
  (game.settings.get as any).mockImplementation((ns: string, k: string) => {
    const s = mockSettings.get(`${ns}.${k}`);
    return s?.value !== undefined ? s.value : s?.default;
  });
}

export function getMockSetting(namespace: string, key: string) {
  return mockSettings.get(`${namespace}.${key}`);
}

// Set up default module for errors-and-echoes
setMockModule('errors-and-echoes', {
  id: 'errors-and-echoes',
  version: '0.1.0',
  api: null
});