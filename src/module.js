/**
 * Errors and Echoes - Main Module File
 * 
 * Anonymous error reporting for Foundry VTT modules.
 * CRITICAL: This module NEVER swallows errors - all errors remain visible to users.
 */

import { ErrorCapture } from './error-capture.js';
import { ErrorAttribution } from './error-attribution.js';
import { ErrorReporter } from './error-reporter.js';
import { ConsentManager } from './consent-manager.js';
import { ErrorReporterWelcomeDialog } from './welcome-dialog.js';

// Global namespace for the module
window.ErrorsAndEchoes = {
  ErrorCapture,
  ErrorAttribution,
  ErrorReporter,
  ConsentManager
};

/**
 * Initialize the module
 */
Hooks.once('init', () => {
  console.log('Errors and Echoes | Initializing error reporting module');
  
  registerSettings();
  
  // Set up API for other modules to integrate
  setupPublicAPI();
});

/**
 * Start error capture when ready (if user has consented)
 */
Hooks.once('ready', async () => {
  console.log('Errors and Echoes | Module ready');
  
  // Show welcome dialog if needed
  if (ConsentManager.shouldShowWelcome()) {
    setTimeout(() => {
      ErrorReporterWelcomeDialog.show();
    }, 2000); // Delay to let Foundry fully load
  }
  
  // Start error capture if user has consented
  if (ConsentManager.hasConsent()) {
    ErrorCapture.startListening();
    console.log('Errors and Echoes | Error capture started (user has consented)');
  }
});

/**
 * Register module settings
 */
function registerSettings() {
  // Global enable/disable setting
  game.settings.register('errors-and-echoes', 'globalEnabled', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.GlobalEnabled.Name'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.GlobalEnabled.Hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: async (enabled) => {
      if (enabled) {
        ErrorCapture.startListening();
        console.log('Errors and Echoes | Error capture enabled via settings');
      } else {
        ErrorCapture.stopListening();
        console.log('Errors and Echoes | Error capture disabled via settings');
      }
    }
  });

  // Privacy level setting
  game.settings.register('errors-and-echoes', 'privacyLevel', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Name'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Hint'),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'minimal': game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.minimal'),
      'standard': game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.standard'),
      'detailed': game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.detailed')
    },
    default: 'standard'
  });

  // Error reporting endpoints (configured separately)
  game.settings.register('errors-and-echoes', 'endpoints', {
    name: 'Error Reporting Endpoints',
    scope: 'client',
    config: false, // Will use custom UI later
    type: Object,
    default: [
      {
        name: "Rayners Modules",
        url: "https://errors.rayners.dev/report/rayners",
        author: "rayners",
        modules: ["journeys-and-jamborees", "realms-and-reaches", "seasons-and-stars", "errors-and-echoes"],
        enabled: true
      }
    ]
  });

  // Internal settings (not shown in config)
  game.settings.register('errors-and-echoes', 'hasShownWelcome', {
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register('errors-and-echoes', 'consentDate', {
    scope: 'client',
    config: false,
    type: String,
    default: null
  });

  game.settings.register('errors-and-echoes', 'endpointConsent', {
    scope: 'client',
    config: false,
    type: Object,
    default: {}
  });

  // Custom settings menu for endpoint configuration (will implement later)
  /*
  game.settings.registerMenu('errors-and-echoes', 'endpointConfig', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Name'),
    label: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Label'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Hint'),
    icon: 'fas fa-cogs',
    type: EndpointConfigDialog,
    restricted: false
  });
  */
}

/**
 * Set up public API for other modules to integrate
 */
function setupPublicAPI() {
  const errorReporterModule = game.modules.get('errors-and-echoes');
  if (!errorReporterModule) return;
  
  // Create API object
  const api = {
    // For modules to register for enhanced reporting
    register: (config) => {
      console.log(`Errors and Echoes | API registration for ${config.moduleId}`);
      // Will implement the full API later
    },
    
    // For manual error reporting
    report: (error, options = {}) => {
      if (!ConsentManager.hasConsent()) return;
      
      const moduleId = options.module || getCallingModule();
      const attribution = {
        moduleId,
        confidence: 'manual',
        method: 'api-call',
        source: 'manual'
      };

      const endpoint = getEndpointForModule(moduleId);
      if (endpoint) {
        ErrorReporter.sendReport(error, attribution, endpoint, options.context || {});
      }
    },
    
    // Check consent status
    hasConsent: () => ConsentManager.hasConsent(),
    
    // Get privacy level
    getPrivacyLevel: () => ConsentManager.getPrivacyLevel(),
    
    // For debugging - get report statistics
    getStats: () => ErrorReporter.getReportStats()
  };
  
  // Expose API
  errorReporterModule.api = api;
  window.ErrorsAndEchoes.API = api;
  
  console.log('Errors and Echoes | Public API registered');
}


/**
 * Get the module ID of the calling code (helper function)
 */
function getCallingModule() {
  const stack = new Error().stack;
  const moduleMatch = stack?.match(/\/modules\/([^\/]+)\//);
  return moduleMatch?.[1] || 'unknown';
}

/**
 * Get the endpoint configuration for a specific module
 */
function getEndpointForModule(moduleId) {
  try {
    const endpoints = game.settings.get('errors-and-echoes', 'endpoints') || [];
    
    return endpoints.find(endpoint => {
      if (!endpoint.enabled) return false;
      
      // Check if module is explicitly listed
      if (endpoint.modules?.includes(moduleId)) return true;
      
      // Check if module matches author
      if (endpoint.author) {
        const module = game.modules.get(moduleId);
        return module?.authors?.some(author => 
          author.name === endpoint.author || author.github === endpoint.author
        );
      }
      
      return false;
    });
  } catch (error) {
    console.warn('Errors and Echoes: Failed to get endpoint for module:', error);
    return null;
  }
}

// Export for debugging/testing
window.ErrorsAndEchoes.showWelcomeDialog = () => ErrorReporterWelcomeDialog.show();