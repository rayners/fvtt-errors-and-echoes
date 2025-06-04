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
import { EndpointConfigDialog } from './settings-ui.js';
import { moduleMatchesAuthor } from './author-utils.js';
import { ModuleRegistry, type ModuleRegistrationConfig } from './module-registry.js';

// Types for the module
interface ErrorsAndEchoesAPI {
  register: (config: ModuleRegistrationConfig) => void;
  report: (error: Error, options?: ReportOptions) => void;
  hasConsent: () => boolean;
  getPrivacyLevel: () => string;
  getStats: () => ReportStats;
}

interface ReportOptions {
  module?: string;
  context?: Record<string, any>;
}

interface ReportStats {
  totalReports: number;
  recentReports: number;
  lastReportTime?: string | undefined;
}

interface EndpointConfig {
  name: string;
  url: string;
  author?: string;
  modules?: string[];
  enabled: boolean;
}

// Global namespace for the module
(window as any).ErrorsAndEchoes = {
  ErrorCapture,
  ErrorAttribution,
  ErrorReporter,
  ConsentManager
};

/**
 * Initialize the module
 */
Hooks.once('init', (): void => {
  console.log('Errors and Echoes | Initializing error reporting module');
  
  registerSettings();
  
  // Set up API for other modules to integrate
  setupPublicAPI();
});

/**
 * Start error capture when ready (if user has consented)
 */
Hooks.once('ready', async (): Promise<void> => {
  console.log('Errors and Echoes | Module ready');
  
  // Start error capture if user has consented
  if (ConsentManager.hasConsent()) {
    ErrorCapture.startListening();
    console.log('Errors and Echoes | Error capture started (user has consented)');
  }
  
  // Show welcome dialog if needed - do this after everything else is set up
  if (ConsentManager.shouldShowWelcome()) {
    // Wait for next tick to ensure UI is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    ErrorReporterWelcomeDialog.show();
  }
});

/**
 * Register module settings
 */
function registerSettings(): void {
  // Global enable/disable setting
  game.settings.register('errors-and-echoes', 'globalEnabled', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.GlobalEnabled.Name'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.GlobalEnabled.Hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: async (enabled: boolean): Promise<void> => {
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
    config: false, // Will use custom UI
    type: Object,
    default: [
      {
        name: "Rayners Modules",
        url: "https://errors.rayners.dev/report/rayners",
        author: "rayners",
        modules: [],
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

  game.settings.register('errors-and-echoes', 'showReportNotifications', {
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register('errors-and-echoes', 'endpointConsent', {
    scope: 'client',
    config: false,
    type: Object,
    default: {}
  });

  // Custom settings menu for endpoint configuration
  game.settings.registerMenu('errors-and-echoes', 'endpointConfig', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Name'),
    label: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Label'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Hint'),
    icon: 'fas fa-cogs',
    type: EndpointConfigDialog,
    restricted: true
  });
}

/**
 * Set up public API for other modules to integrate
 */
function setupPublicAPI(): void {
  const errorReporterModule = game.modules.get('errors-and-echoes');
  if (!errorReporterModule) return;
  
  // Create API object
  const api: ErrorsAndEchoesAPI = {
    // For modules to register for enhanced reporting
    register: (config: ModuleRegistrationConfig): void => {
      ModuleRegistry.register(config);
    },
    
    // For manual error reporting
    report: (error: Error, options: ReportOptions = {}): void => {
      if (!ConsentManager.hasConsent()) return;
      
      const moduleId = options.module || getCallingModule();
      const attribution = {
        moduleId,
        confidence: 'none' as const,
        method: 'unknown' as const,
        source: 'manual' as const
      };

      const endpoint = getEndpointForModule(moduleId);
      if (endpoint) {
        ErrorReporter.sendReport(error, attribution, endpoint, options.context || {});
      }
    },
    
    // Check consent status
    hasConsent: (): boolean => ConsentManager.hasConsent(),
    
    // Get privacy level
    getPrivacyLevel: (): string => ConsentManager.getPrivacyLevel(),
    
    // For debugging - get report statistics
    getStats: (): ReportStats => ErrorReporter.getReportStats()
  };
  
  // Expose API
  errorReporterModule.api = api;
  (window as any).ErrorsAndEchoes.API = api;
  (window as any).ErrorsAndEchoesAPI = api; // Also expose as ErrorsAndEchoesAPI for consistency
  
  console.log('Errors and Echoes | Public API registered');

  // Load Quench integration tests if available
  try {
    import('./quench-tests.js');
  } catch (error) {
    // Quench tests are optional - fail silently if import fails
  }
}

/**
 * Get the module ID of the calling code (helper function)
 */
function getCallingModule(): string {
  const stack = new Error().stack;
  const moduleMatch = stack?.match(/\/modules\/([^\/]+)\//);
  return moduleMatch?.[1] || 'unknown';
}

/**
 * Get the endpoint configuration for a specific module
 */
function getEndpointForModule(moduleId: string): EndpointConfig | undefined {
  try {
    // First check if the module has a custom endpoint registered
    const customEndpoint = ModuleRegistry.getModuleEndpoint(moduleId);
    if (customEndpoint?.enabled) {
      return customEndpoint;
    }

    // Fall back to configured endpoints
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    
    return endpoints.find(endpoint => {
      if (!endpoint.enabled) return false;
      
      // Check if module is explicitly listed
      if (endpoint.modules?.includes(moduleId)) return true;
      
      // Check if module matches author
      if (endpoint.author) {
        const module = game.modules.get(moduleId);
        return moduleMatchesAuthor(module, endpoint.author);
      }
      
      return false;
    });
  } catch (error) {
    console.warn('Errors and Echoes: Failed to get endpoint for module:', error);
    return undefined;
  }
}

// Export for debugging/testing
(window as any).ErrorsAndEchoes.showWelcomeDialog = (): ErrorReporterWelcomeDialog | null => ErrorReporterWelcomeDialog.show();