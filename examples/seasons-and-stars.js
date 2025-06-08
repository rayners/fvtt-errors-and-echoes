/**
 * Integration Example: Seasons and Stars
 * 
 * This example shows how to integrate the Errors and Echoes Registration API
 * with the Seasons and Stars module for enhanced error reporting.
 * 
 * This demonstrates the recommended path-based + self-filtering approach.
 */

// Hook-based registration (RECOMMENDED - eliminates timing issues)
Hooks.on('errorsAndEchoesReady', (errorsAndEchoesAPI) => {
  // E&E is guaranteed to be ready when this hook is called
  try {
    // Register with enhanced error reporting
    errorsAndEchoesAPI.register({
      moduleId: 'seasons-and-stars',
      
      // Context provider - adds useful debugging information
      contextProvider: () => {
        // Use defensive programming to prevent context provider errors
        const context = {};
        
        try {
          // Add current calendar information
          if (game.modules.get('seasons-and-stars')?.api?.getCurrentCalendar) {
            const currentCalendar = game.modules.get('seasons-and-stars').api.getCurrentCalendar();
            if (currentCalendar) {
              context.calendarId = currentCalendar.id;
              context.calendarName = currentCalendar.name;
              context.currentDate = currentCalendar.getCurrentDateString?.() || 'unknown';
            }
          }
        } catch (error) {
          context.calendarDataError = 'Failed to access calendar data';
        }
        
        try {
          // Add widget state information
          const widgetManager = game.modules.get('seasons-and-stars')?.api?.getWidgetManager?.();
          if (widgetManager) {
            context.activeWidgets = widgetManager.getActiveWidgets?.() || [];
            context.widgetPositioning = widgetManager.getPositioningMode?.() || 'unknown';
          }
        } catch (error) {
          context.widgetDataError = 'Failed to access widget data';
        }
        
        try {
          // Add system integration status
          context.smallTimeDetected = !!document.querySelector('#smalltime-app');
          context.simpleCalendarActive = game.modules.get('foundryvtt-simple-calendar')?.active || false;
        } catch (error) {
          context.integrationDataError = 'Failed to check integrations';
        }
        
        try {
          // Add key module settings that might affect behavior
          context.autoAdvanceTime = game.settings.get('seasons-and-stars', 'autoAdvanceTime') || false;
          context.showMiniWidget = game.settings.get('seasons-and-stars', 'showMiniWidget') || false;
          context.debugMode = game.settings.get('seasons-and-stars', 'debugMode') || false;
        } catch (error) {
          // Settings might not be registered yet
          context.settingsError = 'Could not read module settings';
        }
        
        return context;
      },
      
      // Error filter - focus on errors relevant to S&S functionality
      errorFilter: (error) => {
        const stack = error.stack || '';
        const message = error.message || '';
        
        // Always report errors that mention our module explicitly
        if (stack.includes('seasons-and-stars') || 
            message.includes('seasons-and-stars') ||
            message.includes('S&S')) {
          return false; // Don't filter (report this error)
        }
        
        // Report time/calendar related errors that might affect us
        if (message.includes('worldTime') ||
            message.includes('game.time') ||
            message.includes('calendar') ||
            message.includes('dateToWorldTime') ||
            message.includes('worldTimeToDate') ||
            (message.includes('time') && stack.includes('foundry'))) {
          return false; // Don't filter (time system errors affect us)
        }
        
        // Report widget positioning and UI errors
        if (message.includes('widget') ||
            message.includes('SmallTime') ||
            message.includes('player list') ||
            (message.includes('position') && stack.includes('ui')) ||
            message.includes('ApplicationV2')) {
          return false; // Don't filter (UI errors might affect our widgets)
        }
        
        // Report integration-related errors
        if (message.includes('Simple Calendar') ||
            message.includes('simple-calendar') ||
            message.includes('compatibility') ||
            message.includes('bridge') ||
            stack.includes('integration')) {
          return false; // Don't filter (integration errors affect us)
        }
        
        // Report foundry core time system errors
        if (stack.includes('foundry.js') && 
            (message.includes('time') || message.includes('world') || message.includes('scene'))) {
          return false; // Don't filter (core time system issues)
        }
        
        // Filter out errors from unrelated modules (unless they mention calendar/time)
        const unrelatedModules = [
          'dice-so-nice', 'lib-wrapper', 'socketlib', 'combat-utility-belt',
          'enhanced-terrain-layer', 'token-action-hud', 'foundryvtt-forien-quest-log'
        ];
        
        for (const module of unrelatedModules) {
          if (stack.includes(module) && 
              !message.includes('calendar') && 
              !message.includes('time') &&
              !stack.includes('seasons-and-stars')) {
            return true; // Filter out (unrelated module error)
          }
        }
        
        // Default: filter out most other errors unless they seem time/calendar related
        if (message.includes('calendar') || message.includes('time') || message.includes('date')) {
          return false; // Don't filter (might be related)
        }
        
        return true; // Filter out everything else
      },
      
      // Optional: Custom endpoint for S&S specific reports
      endpoint: {
        name: 'Seasons & Stars Development Reports',
        url: 'https://errors.rayners.dev/report/seasons-and-stars',
        author: 'rayners',
        modules: ['seasons-and-stars'],
        enabled: true
      }
    });
    
    console.log('Seasons and Stars: Successfully registered with Errors and Echoes');
    
    // Optional: Store a reference for manual reporting
    window.SeasonsStarsErrorReporting = {
      /**
       * Report a calendar conversion error with context
       */
      reportCalendarError: (error, calendarId, operation) => {
        if (errorsAndEchoesAPI?.report) {
          errorsAndEchoesAPI.report(error, {
            module: 'seasons-and-stars',
            context: {
              category: 'calendar-conversion',
              calendarId: calendarId,
              operation: operation,
              timestamp: new Date().toISOString()
            }
          });
        }
      },
      
      /**
       * Report a widget positioning error
       */
      reportWidgetError: (error, widgetType, positioningMode) => {
        if (errorsAndEchoesAPI?.report) {
          errorsAndEchoesAPI.report(error, {
            module: 'seasons-and-stars',
            context: {
              category: 'widget-positioning',
              widgetType: widgetType,
              positioningMode: positioningMode,
              smallTimePresent: !!document.querySelector('#smalltime-app'),
              timestamp: new Date().toISOString()
            }
          });
        }
      },
      
      /**
       * Report an integration error
       */
      reportIntegrationError: (error, integrationType, moduleId) => {
        if (errorsAndEchoesAPI?.report) {
          errorsAndEchoesAPI.report(error, {
            module: 'seasons-and-stars',
            context: {
              category: 'module-integration',
              integrationType: integrationType,
              targetModule: moduleId,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    };
    
  } catch (error) {
    console.error('Seasons and Stars: Failed to register with Errors and Echoes:', error);
  }
});

// Hook into S&S specific events for automatic error reporting context
Hooks.on('seasonsStarsCalendarChanged', (calendarData) => {
  console.log('Seasons and Stars: Calendar changed, enhanced error reporting active');
});

Hooks.on('seasonsStarsWidgetPositioned', (widgetData) => {
  console.log('Seasons and Stars: Widget positioned, monitoring for positioning errors');
});

/**
 * INTEGRATION NOTES:
 * 
 * This example demonstrates the recommended approach for Seasons & Stars:
 * 
 * 1. PATH-BASED DETECTION: The enhanced path detection in Errors & Echoes
 *    will automatically detect errors from the seasons-and-stars module folder
 * 
 * 2. SELF-FILTERING: The module defines its own logic for what errors it cares about,
 *    focusing on time/calendar operations, widget positioning, and integrations
 * 
 * 3. DOMAIN METADATA: The system will automatically tag errors with domain information
 *    (e.g., 'time-calendar', 'ui-rendering') as helpful metadata for analysis
 * 
 * 4. DEFENSIVE CONTEXT: Context providers use individual try-catch blocks to ensure
 *    failures in one area don't break the entire context collection
 * 
 * 5. MANUAL REPORTING: Provides utility functions for reporting specific error types
 *    with rich context information
 * 
 * This approach is sustainable because:
 * - No central pattern maintenance required
 * - Works with minified/bundled code (path-based detection)
 * - Module authors know their code best (self-filtering)
 * - Domain metadata provides useful analytics without affecting attribution
 */