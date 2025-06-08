/**
 * Comprehensive Author Attribution Tests for Errors & Echoes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetMocks, setMockModule } from './setup';
import { moduleMatchesAuthor, extractAuthorNames, getPrimaryAuthorName, getFormattedAuthorString, hasAuthorInfo } from '../src/author-utils';

describe('Author Attribution', () => {
  beforeEach(async () => {
    resetMocks();
  });

  describe('moduleMatchesAuthor', () => {
    it('should match legacy string author', () => {
      const module = { author: 'rayners' };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'someone-else')).toBe(false);
    });

    it('should match authors array with name field', () => {
      const module = {
        authors: [
          { name: 'rayners', email: 'rayners@gmail.com' },
          { name: 'collaborator', email: 'collab@example.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'collaborator')).toBe(true);
      expect(moduleMatchesAuthor(module, 'unknown')).toBe(false);
    });

    it('should match authors array with github field', () => {
      const module = {
        authors: [
          { name: 'David Raynes', github: 'rayners', email: 'rayners@gmail.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });

    it('should match authors array with email field direct match', () => {
      const module = {
        authors: [
          { name: 'David Raynes', email: 'rayners@gmail.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners@gmail.com')).toBe(true);
    });

    it('should match authors array with email username extraction', () => {
      const module = {
        authors: [
          { name: 'David Raynes', email: 'rayners@gmail.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });

    it('should match authors array with discord field', () => {
      const module = {
        authors: [
          { name: 'David Raynes', discord: 'rayners78' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners78')).toBe(true);
    });

    it('should match authors array with URL field', () => {
      const module = {
        authors: [
          { name: 'David Raynes', url: 'https://github.com/rayners' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });

    it('should match string authors in array', () => {
      const module = {
        authors: ['rayners', 'collaborator']
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'collaborator')).toBe(true);
      expect(moduleMatchesAuthor(module, 'unknown')).toBe(false);
    });

    it('should match mixed string and object authors', () => {
      const module = {
        authors: [
          'rayners',
          { name: 'Collaborator', email: 'collab@example.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'Collaborator')).toBe(true);
      expect(moduleMatchesAuthor(module, 'collab')).toBe(true);
    });

    it('should match authors as Set collection', () => {
      const authorsSet = new Set([
        { name: 'rayners', email: 'rayners@gmail.com' },
        { name: 'collaborator', email: 'collab@example.com' }
      ]);
      const module = { authors: authorsSet };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'collaborator')).toBe(true);
    });

    it('should handle null/undefined module', () => {
      expect(moduleMatchesAuthor(null, 'rayners')).toBe(false);
      expect(moduleMatchesAuthor(undefined, 'rayners')).toBe(false);
    });

    it('should handle empty/null author identifier', () => {
      const module = { author: 'rayners' };
      expect(moduleMatchesAuthor(module, '')).toBe(false);
      expect(moduleMatchesAuthor(module, null as any)).toBe(false);
      expect(moduleMatchesAuthor(module, undefined as any)).toBe(false);
    });

    it('should handle module with no author info', () => {
      const module = { id: 'some-module', version: '1.0.0' };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(false);
    });

    it('should handle empty authors array', () => {
      const module = { authors: [] };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(false);
    });

    it('should handle authors array with null/undefined values', () => {
      const module = { authors: [null, undefined, { name: 'rayners' }] };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });

    it('should handle complex email domains', () => {
      const module = {
        authors: [
          { email: 'rayners@subdomain.company.co.uk' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });

    it('should handle email with plus addressing', () => {
      const module = {
        authors: [
          { email: 'rayners+foundry@gmail.com' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners+foundry')).toBe(true);
    });

    it('should match various GitHub URL patterns', () => {
      const testCases = [
        'https://github.com/rayners',
        'http://github.com/rayners',
        'https://www.github.com/rayners',
        'https://github.com/rayners/',
        'https://github.com/rayners/some-repo'
      ];
      
      testCases.forEach(url => {
        const module = { authors: [{ url }] };
        expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      });
    });

    it('should not match non-GitHub URLs', () => {
      const module = {
        authors: [
          { url: 'https://rayners.dev' }
        ]
      };
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(false);
    });

    it('should handle real-world Seasons & Stars module simulation', () => {
      const module = {
        id: 'seasons-and-stars',
        authors: [
          { 
            name: 'David Raynes', 
            github: 'rayners',
            email: 'rayners@gmail.com',
            discord: 'rayners78',
            url: 'https://github.com/rayners'
          }
        ]
      };
      
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
      expect(moduleMatchesAuthor(module, 'David Raynes')).toBe(true);
      expect(moduleMatchesAuthor(module, 'rayners@gmail.com')).toBe(true);
      expect(moduleMatchesAuthor(module, 'rayners78')).toBe(true);
    });

    it('should handle Foundry processed module data with Set', () => {
      const module = {
        id: 'test-module',
        authors: new Set([
          { 
            name: 'David Raynes',
            email: 'rayners@gmail.com',
            discord: 'rayners78',
            url: 'https://github.com/rayners'
          }
        ])
      };
      
      expect(moduleMatchesAuthor(module, 'rayners')).toBe(true);
    });
  });

  describe('extractAuthorNames', () => {
    it('should extract names from object authors', () => {
      const module = {
        authors: [
          { name: 'David Raynes', email: 'rayners@gmail.com' },
          { name: 'Collaborator', github: 'collab' }
        ]
      };
      const names = extractAuthorNames(module);
      expect(names).toHaveLength(2);
      expect(names).toContain('David Raynes');
      expect(names).toContain('Collaborator');
    });

    it('should prefer name over github/email', () => {
      const module = {
        authors: [
          { name: 'Display Name', github: 'github-user', email: 'user@example.com' }
        ]
      };
      const names = extractAuthorNames(module);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('Display Name');
    });

    it('should extract string authors', () => {
      const module = { authors: ['author1', 'author2'] };
      const names = extractAuthorNames(module);
      expect(names).toHaveLength(2);
      expect(names).toContain('author1');
      expect(names).toContain('author2');
    });

    it('should handle legacy single author field', () => {
      const module = { author: 'Single Author' };
      const names = extractAuthorNames(module);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('Single Author');
    });

    it('should handle empty module', () => {
      const names = extractAuthorNames({});
      expect(names).toHaveLength(0);
    });

    it('should handle null module', () => {
      const names = extractAuthorNames(null);
      expect(names).toHaveLength(0);
    });
  });

  describe('getPrimaryAuthorName', () => {
    it('should return first author name', () => {
      const module = {
        authors: [
          { name: 'Primary Author' },
          { name: 'Secondary Author' }
        ]
      };
      expect(getPrimaryAuthorName(module)).toBe('Primary Author');
    });

    it('should return Unknown for module with no authors', () => {
      const module = { id: 'some-module' };
      expect(getPrimaryAuthorName(module)).toBe('Unknown');
    });
  });

  describe('getFormattedAuthorString', () => {
    it('should format multiple authors with commas', () => {
      const module = {
        authors: [
          { name: 'Author One' },
          { name: 'Author Two' }
        ]
      };
      expect(getFormattedAuthorString(module)).toBe('Author One, Author Two');
    });

    it('should return custom unknown label', () => {
      const module = { id: 'some-module' };
      expect(getFormattedAuthorString(module, 'No Author')).toBe('No Author');
    });
  });

  describe('hasAuthorInfo', () => {
    it('should return true for module with authors', () => {
      const module = { authors: [{ name: 'Someone' }] };
      expect(hasAuthorInfo(module)).toBe(true);
    });

    it('should return false for module without authors', () => {
      const module = { id: 'some-module' };
      expect(hasAuthorInfo(module)).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large authors array efficiently', () => {
      const startTime = performance.now();
      
      // Create a large authors array
      const authors = [];
      for (let i = 0; i < 1000; i++) {
        authors.push({ name: `author${i}`, email: `author${i}@example.com` });
      }
      authors.push({ name: 'rayners', email: 'rayners@gmail.com' }); // Target author
      
      const module = { authors };
      const result = moduleMatchesAuthor(module, 'rayners');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Integration with Mock Game Modules', () => {
    it('should work with modules registered in mock game', () => {
      // Set up a mock module in the game
      setMockModule('test-module', {
        authors: [
          { name: 'Test Author', email: 'test@example.com' }
        ]
      });

      const module = (global as any).game.modules.get('test-module');
      expect(module).toBeDefined();
      expect(moduleMatchesAuthor(module, 'Test Author')).toBe(true);
      expect(moduleMatchesAuthor(module, 'test')).toBe(true); // Email extraction
    });

    it('should work with modules that have various author formats', () => {
      // Test different author formats that Foundry might create
      setMockModule('module-1', {
        authors: new Set([{ name: 'Author One' }])
      });

      setMockModule('module-2', {
        authors: ['String Author']
      });

      setMockModule('module-3', {
        author: 'Legacy Author' // Legacy format
      });

      const module1 = (global as any).game.modules.get('module-1');
      const module2 = (global as any).game.modules.get('module-2');
      const module3 = (global as any).game.modules.get('module-3');

      expect(moduleMatchesAuthor(module1, 'Author One')).toBe(true);
      expect(moduleMatchesAuthor(module2, 'String Author')).toBe(true);
      expect(moduleMatchesAuthor(module3, 'Legacy Author')).toBe(true);
    });
  });
});