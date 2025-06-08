/**
 * Consent Management System
 *
 * Handles user consent for error reporting with privacy controls.
 * Ensures all reporting is opt-in and respects user privacy choices.
 */

import { getSetting } from './utils.js';

export type PrivacyLevel = 'minimal' | 'standard' | 'detailed';

export class ConsentManager {
  /**
   * Check if user has given consent for error reporting
   */
  static hasConsent(): boolean {
    if (!game?.settings) return false;
    return getSetting<boolean>('globalEnabled', false);
  }

  /**
   * Get the user's privacy level setting
   */
  static getPrivacyLevel(): PrivacyLevel {
    if (!game?.settings) return 'standard';
    return getSetting<PrivacyLevel>('privacyLevel', 'standard');
  }

  /**
   * Set user consent and privacy level
   */
  static async setConsent(
    enabled: boolean,
    privacyLevel: PrivacyLevel = 'standard'
  ): Promise<void> {
    if (!game?.settings) {
      console.warn('Errors and Echoes: Cannot set consent - game.settings not available');
      return;
    }

    try {
      await game.settings.set('errors-and-echoes', 'globalEnabled', enabled);
      await game.settings.set('errors-and-echoes', 'privacyLevel', privacyLevel);
      await game.settings.set('errors-and-echoes', 'hasShownWelcome', true);
      await game.settings.set('errors-and-echoes', 'consentDate', new Date().toISOString());

      if (enabled) {
        // Import ErrorCapture dynamically to avoid circular dependencies
        const { ErrorCapture } = await import('./error-capture.js');
        ErrorCapture.startListening();
        ui.notifications.info(game.i18n.localize('ERRORS_AND_ECHOES.Notifications.Enabled'));
      } else {
        const { ErrorCapture } = await import('./error-capture.js');
        ErrorCapture.stopListening();
        ui.notifications.info(game.i18n.localize('ERRORS_AND_ECHOES.Notifications.Disabled'));
      }
    } catch (error) {
      console.error('Errors and Echoes: Failed to set consent:', error);
      ui.notifications.error('Failed to save consent settings');
    }
  }

  /**
   * Check if user has consented to a specific endpoint
   */
  static hasEndpointConsent(endpointUrl: string): boolean {
    if (!game?.settings) return true; // Default to true if settings not available

    try {
      const endpointConsent: Record<string, boolean> =
        game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      return endpointConsent[endpointUrl] !== false; // Default to true if not explicitly set to false
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check endpoint consent:', error);
      return true;
    }
  }

  /**
   * Set consent for a specific endpoint
   */
  static async setEndpointConsent(endpointUrl: string, enabled: boolean): Promise<void> {
    if (!game?.settings) {
      console.warn('Errors and Echoes: Cannot set endpoint consent - game.settings not available');
      return;
    }

    try {
      const endpointConsent: Record<string, boolean> =
        game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      endpointConsent[endpointUrl] = enabled;
      await game.settings.set('errors-and-echoes', 'endpointConsent', endpointConsent);
    } catch (error) {
      console.error('Errors and Echoes: Failed to set endpoint consent:', error);
    }
  }

  /**
   * Check if the welcome dialog should be shown
   */
  static shouldShowWelcome(): boolean {
    if (!game?.settings) return false;

    try {
      const hasShown = game.settings.get('errors-and-echoes', 'hasShownWelcome');
      const hasConsent = this.hasConsent();

      // Show welcome if not shown before, user hasn't already consented, and user is a GM
      return !hasShown && !hasConsent && game.user.isGM;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check welcome status:', error);
      return false;
    }
  }

  /**
   * Get the date when consent was given
   */
  static getConsentDate(): string | null {
    if (!game?.settings) return null;

    try {
      return game.settings.get('errors-and-echoes', 'consentDate') || null;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to get consent date:', error);
      return null;
    }
  }

  /**
   * Check if consent is still valid (not older than 1 year)
   */
  static isConsentValid(): boolean {
    const consentDate = this.getConsentDate();
    if (!consentDate) return false;

    try {
      const consentTime = new Date(consentDate).getTime();
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

      return consentTime > oneYearAgo;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to validate consent date:', error);
      return false;
    }
  }

  /**
   * Revoke all consent and clear settings
   */
  static async revokeConsent(): Promise<void> {
    if (!game?.settings) return;

    try {
      await game.settings.set('errors-and-echoes', 'globalEnabled', false);
      await game.settings.set('errors-and-echoes', 'endpointConsent', {});
      await game.settings.set('errors-and-echoes', 'consentDate', null);

      // Stop error capture
      const { ErrorCapture } = await import('./error-capture.js');
      ErrorCapture.stopListening();

      ui.notifications.info('Error reporting consent revoked');
    } catch (error) {
      console.error('Errors and Echoes: Failed to revoke consent:', error);
    }
  }
}
