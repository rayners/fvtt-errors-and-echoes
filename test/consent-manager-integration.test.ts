/**
 * Integration tests for the actual consent-manager.ts implementation
 *
 * These tests exercise the real consent management logic including
 * settings integration, privacy levels, and endpoint consent.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMocks, resetMocks, setMockSetting } from './setup.js';
import { ConsentManager, type PrivacyLevel } from '../src/consent-manager.js';

describe('ConsentManager Integration (Real Implementation)', () => {
  beforeEach(() => {
    setupMocks();
    resetMocks();

    // Clear any existing consent state
    setMockSetting('errors-and-echoes', 'globalEnabled', false);
    setMockSetting('errors-and-echoes', 'consentDate', null);
    setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
    setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
    setMockSetting('errors-and-echoes', 'endpointConsent', {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('hasConsent() method', () => {
    it('should return false when globalEnabled is false', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      expect(ConsentManager.hasConsent()).toBe(false);
    });

    it('should return true when globalEnabled is true', () => {
      setMockSetting('errors-and-echoes', 'globalEnabled', true);

      expect(ConsentManager.hasConsent()).toBe(true);
    });

    it('should return false by default when no settings exist', () => {
      // Clear all settings to test default behavior
      expect(ConsentManager.hasConsent()).toBe(false);
    });
  });

  describe('setConsent() method', () => {
    it('should set globalEnabled and consentDate when enabled', async () => {
      const beforeTime = new Date();

      await ConsentManager.setConsent(true, 'standard');

      expect((global as any).game.settings.get('errors-and-echoes', 'globalEnabled')).toBe(true);

      const consentDateStr = (global as any).game.settings.get('errors-and-echoes', 'consentDate');
      expect(consentDateStr).toBeTruthy();

      const consentDate = new Date(consentDateStr);
      expect(consentDate).toBeInstanceOf(Date);
      expect(consentDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should enable error capture after granting consent', async () => {
      // Start with consent disabled
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      expect(ConsentManager.hasConsent()).toBe(false);

      await ConsentManager.setConsent(true);

      expect(ConsentManager.hasConsent()).toBe(true);
    });

    it('should set privacy level correctly', async () => {
      // Check initial state
      expect(ConsentManager.getPrivacyLevel()).toBe('standard'); // default

      await ConsentManager.setConsent(true, 'detailed');

      // The setting should have been updated
      expect((global as any).game.settings.get('errors-and-echoes', 'privacyLevel')).toBe(
        'detailed'
      );
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');
    });

    it('should mark welcome as shown', async () => {
      // Set up conditions for showing welcome: not shown, no consent, user is GM
      setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      (global as any).game.user = { isGM: true };

      expect(ConsentManager.shouldShowWelcome()).toBe(true);

      await ConsentManager.setConsent(true);

      // After setting consent, welcome should not show anymore
      expect(ConsentManager.shouldShowWelcome()).toBe(false);
    });
  });

  describe('revokeConsent() method', () => {
    beforeEach(async () => {
      // Start with consent granted
      await ConsentManager.setConsent(true);
      expect(ConsentManager.hasConsent()).toBe(true);
    });

    it('should disable globalEnabled setting', async () => {
      await ConsentManager.revokeConsent();

      expect((global as any).game.settings.get('errors-and-echoes', 'globalEnabled')).toBe(false);
      expect(ConsentManager.hasConsent()).toBe(false);
    });

    it('should clear consentDate', async () => {
      await ConsentManager.revokeConsent();

      const consentDate = (global as any).game.settings.get('errors-and-echoes', 'consentDate');
      expect(consentDate).toBeNull();
    });

    it('should clear endpoint consent', async () => {
      // Set some endpoint consent
      setMockSetting('errors-and-echoes', 'endpointConsent', {
        'https://example.com/endpoint1': true,
        'https://example.com/endpoint2': true,
      });

      await ConsentManager.revokeConsent();

      const endpointConsent = (global as any).game.settings.get(
        'errors-and-echoes',
        'endpointConsent'
      );
      expect(endpointConsent).toEqual({});
    });

    it('should handle revoking when already revoked', async () => {
      await ConsentManager.revokeConsent();
      expect(ConsentManager.hasConsent()).toBe(false);

      // Should not throw when revoking again
      await expect(ConsentManager.revokeConsent()).resolves.not.toThrow();
      expect(ConsentManager.hasConsent()).toBe(false);
    });
  });

  describe('getPrivacyLevel() method', () => {
    it('should return the configured privacy level', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'minimal');
      expect(ConsentManager.getPrivacyLevel()).toBe('minimal');

      setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');

      setMockSetting('errors-and-echoes', 'privacyLevel', 'detailed');
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');
    });

    it('should validate and return standard for invalid privacy levels', () => {
      // The actual implementation validates and returns 'standard' for invalid values
      setMockSetting('errors-and-echoes', 'privacyLevel', 'invalid');
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');

      setMockSetting('errors-and-echoes', 'privacyLevel', null);
      expect(ConsentManager.getPrivacyLevel()).toBe('standard'); // fallback default

      // When undefined, getSetting returns the default
      setMockSetting('errors-and-echoes', 'privacyLevel', undefined);
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');
    });
  });

  describe('setConsent() privacy level handling', () => {
    it('should update the privacy level setting when granting consent', async () => {
      await ConsentManager.setConsent(true, 'detailed');
      expect((global as any).game.settings.get('errors-and-echoes', 'privacyLevel')).toBe(
        'detailed'
      );
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');

      await ConsentManager.setConsent(true, 'minimal');
      expect((global as any).game.settings.get('errors-and-echoes', 'privacyLevel')).toBe(
        'minimal'
      );
      expect(ConsentManager.getPrivacyLevel()).toBe('minimal');
    });

    it('should use default privacy level when not specified', async () => {
      await ConsentManager.setConsent(true);
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');
    });
  });

  describe('shouldShowWelcome() method', () => {
    beforeEach(() => {
      // Set up default user as GM for testing
      (global as any).game.user = { isGM: true };
    });

    it('should return true when conditions are met', () => {
      setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      (global as any).game.user = { isGM: true };

      expect(ConsentManager.shouldShowWelcome()).toBe(true);
    });

    it('should return false when welcome has been shown', () => {
      setMockSetting('errors-and-echoes', 'hasShownWelcome', true);
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      (global as any).game.user = { isGM: true };

      expect(ConsentManager.shouldShowWelcome()).toBe(false);
    });

    it('should return false when user already has consent', () => {
      setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
      setMockSetting('errors-and-echoes', 'globalEnabled', true);
      (global as any).game.user = { isGM: true };

      expect(ConsentManager.shouldShowWelcome()).toBe(false);
    });

    it('should return false when user is not GM', () => {
      setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
      setMockSetting('errors-and-echoes', 'globalEnabled', false);
      (global as any).game.user = { isGM: false };

      expect(ConsentManager.shouldShowWelcome()).toBe(false);
    });
  });

  describe('welcome workflow', () => {
    it('should be handled by setConsent method', async () => {
      expect(ConsentManager.shouldShowWelcome()).toBe(true);

      await ConsentManager.setConsent(true);

      expect((global as any).game.settings.get('errors-and-echoes', 'hasShownWelcome')).toBe(true);
      expect(ConsentManager.shouldShowWelcome()).toBe(false);
    });
  });

  describe('endpoint consent management', () => {
    const testEndpoint1 = 'https://example.com/endpoint1';
    const testEndpoint2 = 'https://example.com/endpoint2';

    describe('hasEndpointConsent() method', () => {
      it('should return true for unknown endpoints (default behavior)', () => {
        // Implementation defaults to true if not explicitly set to false
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true);
      });

      it('should return true for explicitly consented endpoints', () => {
        setMockSetting('errors-and-echoes', 'endpointConsent', {
          [testEndpoint1]: true,
        });

        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true);
        expect(ConsentManager.hasEndpointConsent(testEndpoint2)).toBe(true); // defaults to true
      });

      it('should return false for explicitly denied endpoints', () => {
        setMockSetting('errors-and-echoes', 'endpointConsent', {
          [testEndpoint1]: false,
        });

        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(false);
      });

      it('should handle malformed consent data gracefully', () => {
        setMockSetting('errors-and-echoes', 'endpointConsent', null);
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true); // defaults to true

        setMockSetting('errors-and-echoes', 'endpointConsent', 'invalid');
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true); // defaults to true
      });
    });

    describe('setEndpointConsent() method', () => {
      it('should grant consent for specific endpoint', async () => {
        await ConsentManager.setEndpointConsent(testEndpoint1, true);

        const consent = (global as any).game.settings.get('errors-and-echoes', 'endpointConsent');
        expect(consent[testEndpoint1]).toBe(true);
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true);
      });

      it('should preserve existing endpoint consent', async () => {
        setMockSetting('errors-and-echoes', 'endpointConsent', {
          [testEndpoint1]: true,
        });

        await ConsentManager.setEndpointConsent(testEndpoint2, true);

        const consent = (global as any).game.settings.get('errors-and-echoes', 'endpointConsent');
        expect(consent[testEndpoint1]).toBe(true);
        expect(consent[testEndpoint2]).toBe(true);
      });

      it('should handle invalid endpoint gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'warn');

        await ConsentManager.setEndpointConsent('', true);

        expect(consoleSpy).toHaveBeenCalled();
      });
    });

    describe('revokeEndpointConsent() method', () => {
      beforeEach(() => {
        setMockSetting('errors-and-echoes', 'endpointConsent', {
          [testEndpoint1]: true,
          [testEndpoint2]: true,
        });
      });

      it('should revoke consent for specific endpoint', async () => {
        await ConsentManager.setEndpointConsent(testEndpoint1, false);

        const consent = (global as any).game.settings.get('errors-and-echoes', 'endpointConsent');
        expect(consent[testEndpoint1]).toBe(false);
        expect(consent[testEndpoint2]).toBe(true);
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(false);
      });

      it('should handle revoking non-existent endpoint', async () => {
        await ConsentManager.setEndpointConsent('https://non-existent.com', false);

        const consent = (global as any).game.settings.get('errors-and-echoes', 'endpointConsent');
        expect(consent['https://non-existent.com']).toBe(false);
      });
    });

    describe('endpoint consent persistence', () => {
      it('should persist endpoint consent correctly', async () => {
        await ConsentManager.setEndpointConsent(testEndpoint1, true);
        await ConsentManager.setEndpointConsent(testEndpoint2, false);

        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true);
        expect(ConsentManager.hasEndpointConsent(testEndpoint2)).toBe(false);
      });

      it('should handle malformed consent data gracefully', () => {
        setMockSetting('errors-and-echoes', 'endpointConsent', null);
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true); // defaults to true

        setMockSetting('errors-and-echoes', 'endpointConsent', 'invalid');
        expect(ConsentManager.hasEndpointConsent(testEndpoint1)).toBe(true); // defaults to true
      });
    });
  });

  describe('consent workflow integration', () => {
    beforeEach(() => {
      // Set up proper user context for shouldShowWelcome
      (global as any).game.user = { isGM: true };
    });

    it('should complete full consent workflow', async () => {
      // Start with proper setup for shouldShowWelcome
      setMockSetting('errors-and-echoes', 'hasShownWelcome', false);
      setMockSetting('errors-and-echoes', 'globalEnabled', false);

      expect(ConsentManager.hasConsent()).toBe(false);
      expect(ConsentManager.shouldShowWelcome()).toBe(true);

      // Grant consent with privacy level
      await ConsentManager.setConsent(true, 'detailed');
      expect(ConsentManager.hasConsent()).toBe(true);
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');
      expect(ConsentManager.shouldShowWelcome()).toBe(false); // hasConsent is now true

      // Grant endpoint consent (though it defaults to true anyway)
      const endpoint = 'https://example.com/reports';
      await ConsentManager.setEndpointConsent(endpoint, true);
      expect(ConsentManager.hasEndpointConsent(endpoint)).toBe(true);

      // Verify full state
      expect(ConsentManager.hasConsent()).toBe(true);
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');
      expect(ConsentManager.hasEndpointConsent(endpoint)).toBe(true);
    });

    it('should handle consent revocation workflow', async () => {
      // Start with full consent
      await ConsentManager.setConsent(true, 'detailed');
      await ConsentManager.setEndpointConsent('https://example.com/reports', true);

      expect(ConsentManager.hasConsent()).toBe(true);

      // Revoke consent
      await ConsentManager.revokeConsent();

      // Should clear globalEnabled and endpoint consent
      expect(ConsentManager.hasConsent()).toBe(false);

      // But privacy level should remain (not cleared by revokeConsent)
      expect(ConsentManager.getPrivacyLevel()).toBe('detailed');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing game.settings gracefully', () => {
      // Temporarily remove game.settings
      const originalGame = (global as any).game;
      (global as any).game = { settings: null };

      // Should not throw, should return safe defaults
      expect(() => ConsentManager.hasConsent()).not.toThrow();
      expect(ConsentManager.hasConsent()).toBe(false);

      expect(() => ConsentManager.getPrivacyLevel()).not.toThrow();
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');

      // Restore
      (global as any).game = originalGame;
    });

    it('should handle invalid privacy levels gracefully', () => {
      setMockSetting('errors-and-echoes', 'privacyLevel', 'invalid');
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');

      setMockSetting('errors-and-echoes', 'privacyLevel', null);
      expect(ConsentManager.getPrivacyLevel()).toBe('standard');
    });
  });
});
