/**
 * Errors and Echoes - Main Module File
 *
 * Anonymous error reporting for Foundry VTT modules.
 * CRITICAL: This module NEVER swallows errors - all errors remain visible to users.
 */

import { ErrorCapture } from './error-capture.js';
import { ErrorAttribution } from './error-attribution.js';
import { ErrorReporter } from './error-reporter.js';
import { ConsentManager, type PrivacyLevel } from './consent-manager.js';
import { ErrorReporterWelcomeDialog } from './welcome-dialog.js';
import { EndpointConfigDialog } from './settings-ui.js';
import { moduleMatchesAuthor } from './author-utils.js';
import { ModuleRegistry, type ModuleRegistrationConfig } from './module-registry.js';
import { safeExecute, getModule, debugLog } from './utils.js';
import type { EndpointConfig, BugReportSubmission } from './types.js';

// Types for the module
interface ErrorsAndEchoesAPI {
  register: (config: ModuleRegistrationConfig) => void;
  report: (error: Error, options?: ReportOptions) => void;
  submitBug: (bugReport: BugReportSubmission) => void;
  hasConsent: () => boolean;
  getPrivacyLevel: () => PrivacyLevel;
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

// Global namespace for the module
window.ErrorsAndEchoes = {
  ErrorCapture,
  ErrorAttribution,
  ErrorReporter,
  ConsentManager,
  ModuleRegistry,
  moduleMatchesAuthor, // Export author utility function for debugging/testing
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
    debugLog('Errors and Echoes | Error capture started (user has consented)');
  }

  // Show welcome dialog if needed - do this after everything else is set up
  if (ConsentManager.shouldShowWelcome()) {
    // Wait for next tick to ensure UI is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    ErrorReporterWelcomeDialog.show();
  }

  // Call hook to notify other modules that E&E is ready for registration
  // This allows modules to register via Hooks.on('errorsAndEchoesReady', (api) => { ... })
  // instead of worrying about init vs ready timing
  const errorReporterModule = game.modules.get('errors-and-echoes');
  if (errorReporterModule?.api) {
    Hooks.callAll('errorsAndEchoesReady', errorReporterModule.api);
    debugLog('Errors and Echoes | Hook-based registration system ready');
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
        debugLog('Errors and Echoes | Error capture enabled via settings');
      } else {
        ErrorCapture.stopListening();
        debugLog('Errors and Echoes | Error capture disabled via settings');
      }
    },
  });

  // Privacy level setting
  game.settings.register('errors-and-echoes', 'privacyLevel', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Name'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Hint'),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      minimal: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.minimal'),
      standard: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.standard'),
      detailed: game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.detailed'),
    },
    default: 'standard',
  });

  // Error reporting endpoints (configured separately)
  game.settings.register('errors-and-echoes', 'endpoints', {
    name: 'Error Reporting Endpoints',
    scope: 'client',
    config: false, // Will use custom UI
    type: Object,
    default: [
      {
        name: 'Rayners Modules',
        url: 'https://errors.rayners.dev/report/rayners',
        author: 'rayners',
        modules: [],
        enabled: true,
      },
    ],
  });

  // Internal settings (not shown in config)
  game.settings.register('errors-and-echoes', 'hasShownWelcome', {
    scope: 'client',
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register('errors-and-echoes', 'consentDate', {
    scope: 'client',
    config: false,
    type: String,
    default: null,
  });

  game.settings.register('errors-and-echoes', 'showReportNotifications', {
    scope: 'client',
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register('errors-and-echoes', 'endpointConsent', {
    scope: 'client',
    config: false,
    type: Object,
    default: {},
  });

  // Custom settings menu for endpoint configuration
  game.settings.registerMenu('errors-and-echoes', 'endpointConfig', {
    name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Name'),
    label: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Label'),
    hint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Hint'),
    icon: 'fas fa-cogs',
    type: EndpointConfigDialog,
    restricted: true,
  });
}

/**
 * Set up public API for other modules to integrate
 */
function setupPublicAPI(): void {
  const errorReporterModule = game.modules.get('errors-and-echoes');
  if (!errorReporterModule) return;

  // Create API object with enhanced error handling
  const api: ErrorsAndEchoesAPI = {
    // For modules to register for enhanced reporting
    register: (config: ModuleRegistrationConfig): void => {
      try {
        // Validate config object exists
        if (!config || typeof config !== 'object') {
          console.warn('Errors and Echoes: register() requires a configuration object');
          return;
        }

        ModuleRegistry.register(config);
      } catch (error) {
        console.error('Errors and Echoes: API register() failed:', error);
        console.error('  - This error has been contained and should not affect your module');
      }
    },

    // For manual error reporting
    report: (error: Error, options: ReportOptions = {}): void => {
      try {
        // Validate error parameter
        if (!error || !(error instanceof Error)) {
          console.warn('Errors and Echoes: report() requires an Error object as first parameter');
          return;
        }

        // Check consent before any processing
        if (!ConsentManager.hasConsent()) {
          console.debug('Errors and Echoes: Manual report skipped - user has not consented');
          return;
        }

        // Validate options parameter
        if (options && typeof options !== 'object') {
          console.warn('Errors and Echoes: report() options parameter must be an object');
          options = {};
        }

        const moduleId = options.module || getCallingModule();
        const attribution = {
          moduleId,
          confidence: 'manual' as const,
          method: 'api-call' as const,
          source: 'manual' as const,
        };

        const endpoint = getEndpointForModule(moduleId);
        if (endpoint) {
          ErrorReporter.sendReport(error, attribution, endpoint, options.context || {});
        } else {
          console.debug(
            `Errors and Echoes: No endpoint found for manual report from module '${moduleId}'`
          );
        }
      } catch (reportError) {
        console.error('Errors and Echoes: API report() failed:', reportError);
        console.error('  - This error has been contained and should not affect your module');
      }
    },

    // For manual bug submission
    submitBug: (bugReport: BugReportSubmission): void => {
      try {
        // Validate bug report object exists
        if (!bugReport || typeof bugReport !== 'object') {
          console.warn('Errors and Echoes: submitBug() requires a bug report object');
          return;
        }

        // Validate required fields
        if (
          !bugReport.title ||
          typeof bugReport.title !== 'string' ||
          bugReport.title.trim().length === 0
        ) {
          console.warn('Errors and Echoes: submitBug() requires a non-empty title');
          return;
        }

        if (
          !bugReport.description ||
          typeof bugReport.description !== 'string' ||
          bugReport.description.trim().length === 0
        ) {
          console.warn('Errors and Echoes: submitBug() requires a non-empty description');
          return;
        }

        // Check consent before any processing
        if (!ConsentManager.hasConsent()) {
          console.debug(
            'Errors and Echoes: Manual bug submission skipped - user has not consented'
          );
          return;
        }

        const moduleId = bugReport.module || getCallingModule();

        // Create a synthetic error for compatibility with existing pipeline
        const syntheticError = new Error(`[Manual Bug Report] ${bugReport.title}`);
        syntheticError.stack = `Manual bug submission from module: ${moduleId}`;

        const attribution = {
          moduleId,
          confidence: 'manual' as const,
          method: 'api-call' as const,
          source: 'manual-submission' as const,
        };

        const endpoint = getEndpointForModule(moduleId);
        if (endpoint) {
          ErrorReporter.sendReport(
            syntheticError,
            attribution,
            endpoint,
            bugReport.context || {},
            bugReport
          );
        } else {
          console.debug(
            `Errors and Echoes: No endpoint found for manual bug submission from module '${moduleId}'`
          );
        }
      } catch (submitError) {
        console.error('Errors and Echoes: API submitBug() failed:', submitError);
        console.error('  - This error has been contained and should not affect your module');
      }
    },

    // Check consent status
    hasConsent: (): boolean => {
      return safeExecute(() => ConsentManager.hasConsent(), false, 'API hasConsent() failed');
    },

    // Get privacy level
    getPrivacyLevel: (): PrivacyLevel => {
      return safeExecute(
        () => ConsentManager.getPrivacyLevel(),
        'minimal' as PrivacyLevel,
        'API getPrivacyLevel() failed'
      );
    },

    // For debugging - get report statistics
    getStats: (): ReportStats => {
      return safeExecute(
        () => ErrorReporter.getReportStats(),
        {
          totalReports: 0,
          recentReports: 0,
          lastReportTime: undefined,
        },
        'API getStats() failed'
      );
    },
  };

  // Expose API
  errorReporterModule.api = api;
  window.ErrorsAndEchoes.API = api;
  window.ErrorsAndEchoesAPI = api; // Also expose as ErrorsAndEchoesAPI for consistency

  console.log('Errors and Echoes | Public API registered');

  // Load Quench integration tests if available
  try {
    import('./quench-tests.js');
  } catch {
    // Quench tests are optional - fail silently if import fails
  }
}

/**
 * Get the module ID of the calling code (helper function)
 */
function getCallingModule(): string {
  const stack = new Error().stack;
  const moduleMatch = stack?.match(/\/modules\/([^/]+)\//);
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
        const module = getModule(moduleId);
        return module && moduleMatchesAuthor(module, endpoint.author);
      }

      return false;
    });
  } catch (error) {
    console.warn('Errors and Echoes: Failed to get endpoint for module:', error);
    return undefined;
  }
}

// Export for debugging/testing
window.ErrorsAndEchoes.showWelcomeDialog = (): ErrorReporterWelcomeDialog | null =>
  ErrorReporterWelcomeDialog.show();
