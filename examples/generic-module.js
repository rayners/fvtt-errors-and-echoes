/**
 * Integration Example: Generic Module Template
 * 
 * This template shows the hook-based pattern for integrating any module
 * with the Errors and Echoes Registration API.
 * 
 * Copy this template and customize for your specific module.
 */

// Hook-based registration (RECOMMENDED - eliminates timing issues)
Hooks.on('errorsAndEchoesReady', (errorsAndEchoesAPI) => {
  // E&E is guaranteed to be ready when this hook is called
  try {
    // Register with enhanced error reporting
    errorsAndEchoesAPI.register({
      // REQUIRED: Your module ID (must match module.json)
      moduleId: 'your-module-id',
      
      // OPTIONAL: Context provider function
      // This function is called whenever an error is reported
      // Return an object with debugging information relevant to your module
      contextProvider: () => {
        const context = {};
        
        // Add your module's current state
        // Example: Active features, current mode, important settings
        context.moduleVersion = game.modules.get('your-module-id')?.version;
        context.isActive = true; // or however you determine active state
        
        // Add relevant game state
        context.gameSystem = game.system.id;
        context.activeScene = game.scenes?.active?.name || 'none';
        context.userRole = game.user.role;
        
        // Add key settings that might affect behavior
        try {
          context.yourImportantSetting = game.settings.get('your-module-id', 'important-setting');
          context.debugMode = game.settings.get('your-module-id', 'debug-mode') || false;
        } catch (e) {
          context.settingsError = 'Could not read module settings';
        }
        
        // Add current state of your module's main features
        // Example for a combat module:
        // context.combatActive = game.combat?.active || false;
        // context.currentTurn = game.combat?.turn || 0;
        
        // Example for a utility module:
        // context.toolsOpen = Object.keys(yourModule.openTools).length;
        // context.lastOperation = yourModule.lastOperation;
        
        return context;
      },
      
      // OPTIONAL: Error filter function
      // Return true to filter OUT (not report) an error
      // Return false to allow the error to be reported
      errorFilter: (error) => {
        const stack = error.stack || '';
        const message = error.message || '';
        
        // Always report errors that mention your module
        if (stack.includes('your-module-id') || 
            message.includes('your-module-specific-term')) {
          return false; // Don't filter (report this error)
        }
        
        // Report errors in core systems that might affect your module
        if (stack.includes('foundry.js') || 
            stack.includes('ClientDatabaseBackend') ||
            message.includes('Database')) {
          return false; // Don't filter (these might affect us)
        }
        
        // Filter out errors from unrelated modules
        const unrelatedModules = [
          'some-other-module',
          'another-module-that-causes-noise'
        ];
        
        for (const module of unrelatedModules) {
          if (stack.includes(module) && !stack.includes('your-module-id')) {
            return true; // Filter out (don't report)
          }
        }
        
        // Report errors related to features your module uses
        const relatedFeatures = [
          'Canvas', 'Token', 'Actor', 'Item', 'Scene', 'User'
          // Add Foundry classes your module interacts with
        ];
        
        for (const feature of relatedFeatures) {
          if (stack.includes(feature) || message.includes(feature)) {
            return false; // Don't filter (might be related)
          }
        }
        
        // Default: filter out most other errors
        return true;
      },
      
      // OPTIONAL: Module reporting endpoint
      // Remove this section to use the configured endpoints in settings
      // User controls enabled/disabled via E&E settings UI
      reportingEndpoint: {
        name: 'Your Module Error Reports',
        url: 'https://your-domain.com/error-reports'
        // URL is not editable by user (provided by module)
      }
    });
    
    console.log('Your Module: Successfully registered with Errors and Echoes');
    
    // OPTIONAL: Store a reference for manual reporting
    window.YourModuleErrorReporting = {
      /**
       * Report a specific type of error with additional context
       */
      reportSpecificError: (error, additionalContext = {}) => {
        if (errorsAndEchoesAPI?.report) {
          errorsAndEchoesAPI.report(error, {
            module: 'your-module-id',
            context: {
              category: 'your-module-specific-category',
              ...additionalContext,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    };
    
  } catch (error) {
    console.error('Your Module: Failed to register with Errors and Echoes:', error);
  }
});

// OPTIONAL: Hook into your module's specific events
Hooks.on('yourModuleEvent', (data) => {
  console.log('Your Module: Event triggered, enhanced error reporting active');
});

// OPTIONAL: Example manual error reporting in your module's code
function yourModuleFunction() {
  try {
    // Your module's functionality here
    performSomeOperation();
  } catch (error) {
    // Report the error with context
    if (window.YourModuleErrorReporting) {
      window.YourModuleErrorReporting.reportSpecificError(error, {
        operation: 'performSomeOperation',
        userInput: 'sanitized-user-input',
        moduleState: 'current-state'
      });
    }
    
    // Handle the error appropriately
    ui.notifications.error('Operation failed. Error has been reported.');
  }
}

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. Replace 'your-module-id' with your actual module ID (must match module.json)
 * 2. Update the contextProvider to return relevant debugging information for your module
 * 3. Customize the errorFilter to focus on errors relevant to your module
 * 4. Update the reportingEndpoint URL to point to your error collection service (optional)
 * 5. Add manual error reporting calls in critical functions (optional)
 * 6. Test the integration in development
 * 
 * HOOK-BASED REGISTRATION BENEFITS:
 * 
 * - No timing issues: Works regardless of module load order
 * - Automatic retry: If E&E loads after your module, registration still works
 * - Cleaner code: No manual checking if E&E is available
 * - Future-proof: Works with any E&E initialization changes
 * 
 * BEST PRACTICES:
 * 
 * - Keep context data small and relevant (avoid large objects)
 * - Don't include sensitive user data in context
 * - Use error filters to reduce noise and focus on actionable errors
 * - Test your error filter thoroughly to avoid missing important errors
 * - Users control endpoint enabling - your reportingEndpoint is just a suggestion
 * - Consider your users' privacy when designing context providers
 */