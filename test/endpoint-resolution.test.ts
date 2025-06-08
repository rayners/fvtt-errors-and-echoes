/**
 * Tests for Module Endpoint Resolution and Author Matching Integration
 * 
 * Tests how the E&E system resolves which endpoint to use for a given module
 * based on author matching logic and explicit module configurations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMocks, resetMocks, setMockSetting, setMockModule } from './setup.js';
import { ModuleRegistry } from '../src/module-registry.js';
import { moduleMatchesAuthor, extractAuthorNames, getPrimaryAuthorName } from '../src/author-utils.js';

describe('Module Endpoint Resolution and Author Matching', () => {
  beforeEach(() => {
    setupMocks();
    resetMocks();
  });

  afterEach(() => {
    ModuleRegistry.clearAll();
    vi.clearAllMocks();
  });

  describe('Author Matching Utilities', () => {
    it('should match modules by author name', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author', email: 'test@example.com' }]
      };

      expect(moduleMatchesAuthor(module, 'Test Author')).toBe(true);
      expect(moduleMatchesAuthor(module, 'Other Author')).toBe(false);
    });

    it('should match modules by author email', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author', email: 'test@example.com' }]
      };

      expect(moduleMatchesAuthor(module, 'test@example.com')).toBe(true);
      expect(moduleMatchesAuthor(module, 'other@example.com')).toBe(false);
    });

    it('should match modules by author GitHub username', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author', github: 'testuser' }]
      };

      expect(moduleMatchesAuthor(module, 'testuser')).toBe(true);
      expect(moduleMatchesAuthor(module, 'otheruser')).toBe(false);
    });

    it('should match modules by email username part', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author', email: 'testuser@example.com' }]
      };

      expect(moduleMatchesAuthor(module, 'testuser')).toBe(true);
      expect(moduleMatchesAuthor(module, 'otheruser')).toBe(false);
    });

    it('should match modules by GitHub URL', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author', url: 'https://github.com/testuser' }]
      };

      expect(moduleMatchesAuthor(module, 'testuser')).toBe(true);
      expect(moduleMatchesAuthor(module, 'otheruser')).toBe(false);
    });

    it('should handle legacy single author field', () => {
      const module = {
        id: 'legacy-module',
        author: 'Legacy Author'
      };

      expect(moduleMatchesAuthor(module, 'Legacy Author')).toBe(true);
      expect(moduleMatchesAuthor(module, 'Other Author')).toBe(false);
    });

    it('should handle authors as array of strings', () => {
      const module = {
        id: 'string-authors-module',
        authors: ['Author One', 'Author Two']
      };

      expect(moduleMatchesAuthor(module, 'Author One')).toBe(true);
      expect(moduleMatchesAuthor(module, 'Author Two')).toBe(true);
      expect(moduleMatchesAuthor(module, 'Author Three')).toBe(false);
    });

    it('should extract author names correctly', () => {
      const module = {
        id: 'multi-author-module',
        authors: [
          { name: 'Author One', email: 'one@example.com' },
          { name: 'Author Two', github: 'author2' },
          'String Author'
        ]
      };

      const authorNames = extractAuthorNames(module);
      expect(authorNames).toEqual(['Author One', 'Author Two', 'String Author']);
    });

    it('should get primary author name', () => {
      const module = {
        id: 'primary-author-module',
        authors: [
          { name: 'Primary Author', email: 'primary@example.com' },
          { name: 'Secondary Author', email: 'secondary@example.com' }
        ]
      };

      expect(getPrimaryAuthorName(module)).toBe('Primary Author');
    });

    it('should handle modules with no author info', () => {
      const module = { id: 'no-author-module' };

      expect(moduleMatchesAuthor(module, 'Any Author')).toBe(false);
      expect(extractAuthorNames(module)).toEqual([]);
      expect(getPrimaryAuthorName(module)).toBe('Unknown');
    });
  });

  describe('Module Registry Endpoint Resolution', () => {
    it('should register module with custom endpoint', () => {
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'Test Author', email: 'test@example.com' }]
      });

      const customEndpoint = {
        name: 'Test Module Endpoint',
        url: 'https://test-module.example.com/errors',
        author: 'Test Author',
        modules: ['test-module'],
        enabled: true
      };

      ModuleRegistry.register({
        moduleId: 'test-module',
        endpoint: customEndpoint
      });

      expect(ModuleRegistry.isRegistered('test-module')).toBe(true);
      
      const endpoint = ModuleRegistry.getModuleEndpoint('test-module');
      expect(endpoint).toEqual(customEndpoint);
    });

    it('should return undefined for module without custom endpoint', () => {
      setMockModule('no-endpoint-module', {
        id: 'no-endpoint-module',
        title: 'No Endpoint Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'no-endpoint-module'
      });

      const endpoint = ModuleRegistry.getModuleEndpoint('no-endpoint-module');
      expect(endpoint).toBeUndefined();
    });

    it('should return undefined for unregistered module', () => {
      const endpoint = ModuleRegistry.getModuleEndpoint('unregistered-module');
      expect(endpoint).toBeUndefined();
    });
  });

  describe('Author-Based Endpoint Selection Logic', () => {
    it('should find endpoint by author matching', () => {
      // Set up modules with known authors
      setMockModule('rayners-module-1', {
        id: 'rayners-module-1',
        title: 'Rayners Module 1',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'David Raynes', github: 'rayners', email: 'david@example.com' }]
      });

      setMockModule('rayners-module-2', {
        id: 'rayners-module-2',
        title: 'Rayners Module 2',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'David Raynes', github: 'rayners' }]
      });

      setMockModule('other-module', {
        id: 'other-module',
        title: 'Other Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'Other Author', email: 'other@example.com' }]
      });

      // Set up endpoints configuration
      const endpoints = [
        {
          name: 'Rayners Endpoint',
          url: 'https://rayners.example.com/errors',
          author: 'rayners',
          enabled: true
        },
        {
          name: 'Other Author Endpoint',
          url: 'https://other.example.com/errors',
          author: 'Other Author',
          enabled: true
        }
      ];

      setMockSetting('errors-and-echoes', 'endpoints', endpoints);

      // Helper function to simulate endpoint resolution logic
      const findEndpointForModule = (moduleId: string) => {
        const module = (global as any).game.modules.get(moduleId);
        if (!module) return null;

        const endpoints = (global as any).game.settings.get('errors-and-echoes', 'endpoints') || [];
        
        for (const endpoint of endpoints) {
          if (!endpoint.enabled) continue;
          
          // Check if module explicitly listed
          if (endpoint.modules && endpoint.modules.includes(moduleId)) {
            return endpoint;
          }
          
          // Check if module author matches endpoint author
          if (endpoint.author && moduleMatchesAuthor(module, endpoint.author)) {
            return endpoint;
          }
        }
        
        return null;
      };

      // Test endpoint resolution
      const rayners1Endpoint = findEndpointForModule('rayners-module-1');
      expect(rayners1Endpoint).toEqual({
        name: 'Rayners Endpoint',
        url: 'https://rayners.example.com/errors',
        author: 'rayners',
        enabled: true
      });

      const rayners2Endpoint = findEndpointForModule('rayners-module-2');
      expect(rayners2Endpoint).toEqual({
        name: 'Rayners Endpoint',
        url: 'https://rayners.example.com/errors',
        author: 'rayners',
        enabled: true
      });

      const otherEndpoint = findEndpointForModule('other-module');
      expect(otherEndpoint).toEqual({
        name: 'Other Author Endpoint',
        url: 'https://other.example.com/errors',
        author: 'Other Author',
        enabled: true
      });

      const unknownEndpoint = findEndpointForModule('unknown-module');
      expect(unknownEndpoint).toBeNull();
    });

    it('should prioritize explicit module listing over author matching', () => {
      setMockModule('special-module', {
        id: 'special-module',
        title: 'Special Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'David Raynes', github: 'rayners' }]
      });

      const endpoints = [
        {
          name: 'General Rayners Endpoint',
          url: 'https://rayners.example.com/errors',
          author: 'rayners',
          enabled: true
        },
        {
          name: 'Special Module Endpoint',
          url: 'https://special.example.com/errors',
          modules: ['special-module'],
          enabled: true
        }
      ];

      setMockSetting('errors-and-echoes', 'endpoints', endpoints);

      const findEndpointForModule = (moduleId: string) => {
        const module = (global as any).game.modules.get(moduleId);
        if (!module) return null;

        const endpoints = (global as any).game.settings.get('errors-and-echoes', 'endpoints') || [];
        
        // Check explicit module listing first
        for (const endpoint of endpoints) {
          if (!endpoint.enabled) continue;
          if (endpoint.modules && endpoint.modules.includes(moduleId)) {
            return endpoint;
          }
        }
        
        // Then check author matching
        for (const endpoint of endpoints) {
          if (!endpoint.enabled) continue;
          if (endpoint.author && moduleMatchesAuthor(module, endpoint.author)) {
            return endpoint;
          }
        }
        
        return null;
      };

      const endpoint = findEndpointForModule('special-module');
      expect(endpoint).toEqual({
        name: 'Special Module Endpoint',
        url: 'https://special.example.com/errors',
        modules: ['special-module'],
        enabled: true
      });
    });

    it('should skip disabled endpoints', () => {
      setMockModule('test-module', {
        id: 'test-module',
        title: 'Test Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'Test Author' }]
      });

      const endpoints = [
        {
          name: 'Disabled Endpoint',
          url: 'https://disabled.example.com/errors',
          author: 'Test Author',
          enabled: false
        },
        {
          name: 'Enabled Endpoint',
          url: 'https://enabled.example.com/errors',
          author: 'Test Author',
          enabled: true
        }
      ];

      setMockSetting('errors-and-echoes', 'endpoints', endpoints);

      const findEndpointForModule = (moduleId: string) => {
        const module = (global as any).game.modules.get(moduleId);
        if (!module) return null;

        const endpoints = (global as any).game.settings.get('errors-and-echoes', 'endpoints') || [];
        
        for (const endpoint of endpoints) {
          if (!endpoint.enabled) continue;
          
          if (endpoint.modules && endpoint.modules.includes(moduleId)) {
            return endpoint;
          }
          
          if (endpoint.author && moduleMatchesAuthor(module, endpoint.author)) {
            return endpoint;
          }
        }
        
        return null;
      };

      const endpoint = findEndpointForModule('test-module');
      expect(endpoint).toEqual({
        name: 'Enabled Endpoint',
        url: 'https://enabled.example.com/errors',
        author: 'Test Author',
        enabled: true
      });
    });

    it('should handle complex author matching scenarios', () => {
      setMockModule('complex-module', {
        id: 'complex-module',
        title: 'Complex Module',
        version: '1.0.0',
        active: true,
        authors: [
          { 
            name: 'David Raynes',
            github: 'rayners',
            email: 'david.raynes@example.com',
            url: 'https://github.com/rayners'
          }
        ]
      });

      const endpoints = [
        {
          name: 'Email Match Endpoint',
          url: 'https://email.example.com/errors',
          author: 'david.raynes@example.com',
          enabled: true
        }
      ];

      setMockSetting('errors-and-echoes', 'endpoints', endpoints);

      const findEndpointForModule = (moduleId: string) => {
        const module = (global as any).game.modules.get(moduleId);
        if (!module) return null;

        const endpoints = (global as any).game.settings.get('errors-and-echoes', 'endpoints') || [];
        
        for (const endpoint of endpoints) {
          if (!endpoint.enabled) continue;
          
          if (endpoint.modules && endpoint.modules.includes(moduleId)) {
            return endpoint;
          }
          
          if (endpoint.author && moduleMatchesAuthor(module, endpoint.author)) {
            return endpoint;
          }
        }
        
        return null;
      };

      // Should match by email
      const emailEndpoint = findEndpointForModule('complex-module');
      expect(emailEndpoint?.name).toBe('Email Match Endpoint');

      // Should also match by GitHub username
      endpoints[0].author = 'rayners';
      const githubEndpoint = findEndpointForModule('complex-module');
      expect(githubEndpoint?.name).toBe('Email Match Endpoint');

      // Should also match by email username part
      endpoints[0].author = 'david.raynes';
      const usernameEndpoint = findEndpointForModule('complex-module');
      expect(usernameEndpoint?.name).toBe('Email Match Endpoint');
    });
  });

  describe('Integration with Module Registry', () => {
    it('should integrate endpoint resolution with module registration', () => {
      setMockModule('integrated-module', {
        id: 'integrated-module',
        title: 'Integrated Module',
        version: '1.0.0',
        active: true,
        authors: [{ name: 'Integration Author', github: 'integrator' }]
      });

      // Register module with explicit endpoint
      const explicitEndpoint = {
        name: 'Explicit Integration Endpoint',
        url: 'https://explicit.example.com/errors',
        author: 'Integration Author',
        enabled: true
      };

      ModuleRegistry.register({
        moduleId: 'integrated-module',
        endpoint: explicitEndpoint,
        contextProvider: () => ({
          integrationTest: true,
          authorInfo: getPrimaryAuthorName((global as any).game.modules.get('integrated-module'))
        })
      });

      // Verify registration and endpoint retrieval
      expect(ModuleRegistry.isRegistered('integrated-module')).toBe(true);
      
      const registeredEndpoint = ModuleRegistry.getModuleEndpoint('integrated-module');
      expect(registeredEndpoint).toEqual(explicitEndpoint);

      // Verify context includes author information
      const context = ModuleRegistry.getModuleContext('integrated-module');
      expect(context.integrationTest).toBe(true);
      expect(context.authorInfo).toBe('Integration Author');
    });

    it('should track statistics for modules with endpoints', () => {
      setMockModule('endpoint-module-1', {
        id: 'endpoint-module-1',
        title: 'Endpoint Module 1',
        version: '1.0.0',
        active: true
      });

      setMockModule('endpoint-module-2', {
        id: 'endpoint-module-2',
        title: 'Endpoint Module 2',
        version: '1.0.0',
        active: true
      });

      setMockModule('no-endpoint-module', {
        id: 'no-endpoint-module',
        title: 'No Endpoint Module',
        version: '1.0.0',
        active: true
      });

      // Register modules with and without endpoints
      ModuleRegistry.register({
        moduleId: 'endpoint-module-1',
        endpoint: {
          name: 'Endpoint 1',
          url: 'https://endpoint1.example.com/errors',
          enabled: true
        }
      });

      ModuleRegistry.register({
        moduleId: 'endpoint-module-2',
        endpoint: {
          name: 'Endpoint 2',
          url: 'https://endpoint2.example.com/errors',
          enabled: true
        }
      });

      ModuleRegistry.register({
        moduleId: 'no-endpoint-module'
      });

      const stats = ModuleRegistry.getStats();
      expect(stats.totalRegistered).toBe(3);
      expect(stats.modulesWithEndpoints).toBe(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed author data gracefully', () => {
      const malformedModule = {
        id: 'malformed-module',
        authors: 'not-an-array' // Invalid format
      };

      expect(moduleMatchesAuthor(malformedModule, 'any-author')).toBe(false);
      expect(extractAuthorNames(malformedModule)).toEqual([]);
    });

    it('should handle null/undefined modules gracefully', () => {
      expect(moduleMatchesAuthor(null, 'any-author')).toBe(false);
      expect(moduleMatchesAuthor(undefined, 'any-author')).toBe(false);
      expect(extractAuthorNames(null)).toEqual([]);
      expect(extractAuthorNames(undefined)).toEqual([]);
    });

    it('should handle empty author identifier gracefully', () => {
      const module = {
        id: 'test-module',
        authors: [{ name: 'Test Author' }]
      };

      expect(moduleMatchesAuthor(module, '')).toBe(false);
      expect(moduleMatchesAuthor(module, null)).toBe(false);
      expect(moduleMatchesAuthor(module, undefined)).toBe(false);
    });

    it('should handle modules with no endpoint when endpoint requested', () => {
      setMockModule('no-endpoint-module', {
        id: 'no-endpoint-module',
        title: 'No Endpoint Module',
        version: '1.0.0',
        active: true
      });

      ModuleRegistry.register({
        moduleId: 'no-endpoint-module'
      });

      const endpoint = ModuleRegistry.getModuleEndpoint('no-endpoint-module');
      expect(endpoint).toBeUndefined();
    });
  });
});