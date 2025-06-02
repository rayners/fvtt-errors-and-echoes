/**
 * Consent Management System
 * 
 * Handles user consent for error reporting with privacy controls.
 * Ensures all reporting is opt-in and respects user privacy choices.
 */
export class ConsentManager {
  
  /**
   * Check if user has given consent for error reporting
   */
  static hasConsent() {
    if (!game?.settings) return false;
    
    try {
      return game.settings.get('errors-and-echoes', 'globalEnabled') === true;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check consent:', error);
      return false;
    }
  }

  /**
   * Get the user's privacy level setting
   */
  static getPrivacyLevel() {
    if (!game?.settings) return 'standard';
    
    try {
      return game.settings.get('errors-and-echoes', 'privacyLevel') || 'standard';
    } catch (error) {
      console.warn('Errors and Echoes: Failed to get privacy level:', error);
      return 'standard';
    }
  }

  /**
   * Set user consent and privacy level
   */
  static async setConsent(enabled, privacyLevel = 'standard') {
    if (!game?.settings) {
      console.warn('Errors and Echoes: Cannot set consent - game settings not available');
      return;
    }

    try {
      await game.settings.set('errors-and-echoes', 'globalEnabled', enabled);
      await game.settings.set('errors-and-echoes', 'privacyLevel', privacyLevel);
      await game.settings.set('errors-and-echoes', 'hasShownWelcome', true);
      await game.settings.set('errors-and-echoes', 'consentDate', new Date().toISOString());

      if (enabled) {
        // Start error capture
        const { ErrorCapture } = await import('./error-capture.js');
        ErrorCapture.startListening();
        
        // Show success notification
        ui.notifications.info(
          game.i18n.localize('ERRORS_AND_ECHOES.Notifications.Enabled')
        );
      } else {
        // Stop error capture
        const { ErrorCapture } = await import('./error-capture.js');
        ErrorCapture.stopListening();
        
        // Show disabled notification
        ui.notifications.info(
          game.i18n.localize('ERRORS_AND_ECHOES.Notifications.Disabled')
        );
      }
    } catch (error) {
      console.error('Errors and Echoes: Failed to set consent:', error);
      ui.notifications.error('Failed to update error reporting settings');
    }
  }

  /**
   * Check if user has given consent for a specific endpoint
   */
  static hasEndpointConsent(endpointUrl) {
    if (!game?.settings) return true; // Default to true if settings not available
    
    try {
      const endpointConsent = game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      return endpointConsent[endpointUrl] !== false; // Default to true if not explicitly set to false
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check endpoint consent:', error);
      return true; // Default to allowing
    }
  }

  /**
   * Set consent for a specific endpoint
   */
  static async setEndpointConsent(endpointUrl, enabled) {
    if (!game?.settings) {
      console.warn('Errors and Echoes: Cannot set endpoint consent - game settings not available');
      return;
    }

    try {
      const endpointConsent = game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      endpointConsent[endpointUrl] = enabled;
      await game.settings.set('errors-and-echoes', 'endpointConsent', endpointConsent);
    } catch (error) {
      console.error('Errors and Echoes: Failed to set endpoint consent:', error);
    }
  }

  /**
   * Check if welcome dialog should be shown
   */
  static shouldShowWelcome() {
    if (!game?.settings) return false;
    
    try {
      const hasShownWelcome = game.settings.get('errors-and-echoes', 'hasShownWelcome');
      const globalEnabled = game.settings.get('errors-and-echoes', 'globalEnabled');
      
      // Show welcome if we haven't shown it before and user hasn't explicitly enabled/disabled
      return !hasShownWelcome && globalEnabled === undefined;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check welcome status:', error);
      return false;
    }
  }

  /**
   * Get consent information for transparency
   */
  static getConsentInfo() {
    if (!game?.settings) return null;
    
    try {
      return {
        enabled: this.hasConsent(),
        privacyLevel: this.getPrivacyLevel(),
        consentDate: game.settings.get('errors-and-echoes', 'consentDate'),
        hasShownWelcome: game.settings.get('errors-and-echoes', 'hasShownWelcome'),
        endpointConsent: game.settings.get('errors-and-echoes', 'endpointConsent') || {}
      };
    } catch (error) {
      console.warn('Errors and Echoes: Failed to get consent info:', error);
      return null;
    }
  }

  /**
   * Reset all consent settings (for testing or user request)
   */
  static async resetConsent() {
    if (!game?.settings) {
      console.warn('Errors and Echoes: Cannot reset consent - game settings not available');
      return;
    }

    try {
      // Stop error capture first
      const { ErrorCapture } = await import('./error-capture.js');
      ErrorCapture.stopListening();
      
      // Reset all consent-related settings
      await game.settings.set('errors-and-echoes', 'globalEnabled', false);
      await game.settings.set('errors-and-echoes', 'privacyLevel', 'standard');
      await game.settings.set('errors-and-echoes', 'hasShownWelcome', false);
      await game.settings.set('errors-and-echoes', 'consentDate', null);
      await game.settings.set('errors-and-echoes', 'endpointConsent', {});
      
      ui.notifications.info('Error reporting consent has been reset');
    } catch (error) {
      console.error('Errors and Echoes: Failed to reset consent:', error);
      ui.notifications.error('Failed to reset consent settings');
    }
  }

  /**
   * Validate privacy level setting
   */
  static isValidPrivacyLevel(level) {
    const validLevels = ['minimal', 'standard', 'detailed'];
    return validLevels.includes(level);
  }

  /**
   * Get privacy level description for UI
   */
  static getPrivacyLevelDescription(level) {
    const descriptions = {
      'minimal': 'Only error message and stack trace',
      'standard': 'Error + Foundry version + active modules',
      'detailed': 'Standard + browser info + scene context'
    };
    
    return descriptions[level] || descriptions['standard'];
  }

  /**
   * Check if user should be prompted to update consent (e.g., after major version changes)
   */
  static shouldPromptConsentUpdate() {
    if (!game?.settings) return false;
    
    try {
      const consentDate = game.settings.get('errors-and-echoes', 'consentDate');
      const moduleVersion = game.modules.get('errors-and-echoes')?.version;
      
      // If no consent date, they need to give initial consent
      if (!consentDate) return true;
      
      // Check if consent is older than 1 year (optional - for major updates)
      const consentTime = new Date(consentDate).getTime();
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      
      return consentTime < oneYearAgo;
    } catch (error) {
      console.warn('Errors and Echoes: Failed to check consent update status:', error);
      return false;
    }
  }
}