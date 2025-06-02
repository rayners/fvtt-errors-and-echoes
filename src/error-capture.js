/**
 * Error Capture System - CRITICAL: NEVER SWALLOW ERRORS
 * 
 * This class listens for errors and captures them for reporting while ensuring
 * that all errors remain visible to users and continue normal propagation.
 */
export class ErrorCapture {
  static isListening = false;
  static originalConsoleError = null;
  static originalConsoleWarn = null;

  /**
   * Start listening for errors - CRITICAL: NEVER preventDefault()
   */
  static startListening() {
    if (this.isListening) return;
    
    console.log('Errors and Echoes: Starting error capture (errors will remain visible)');
    
    // JavaScript errors - NEVER preventDefault()
    window.addEventListener('error', this.handleWindowError.bind(this));
    
    // Promise rejections - NEVER preventDefault()
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Console.error patching (preserve original behavior)
    this.patchConsoleError();
    
    // Console.warn patching (preserve original behavior)
    this.patchConsoleWarn();
    
    // Foundry hook errors (don't interfere with hook execution)
    this.patchFoundryHooks();
    
    this.isListening = true;
  }

  /**
   * Stop listening for errors
   */
  static stopListening() {
    if (!this.isListening) return;
    
    console.log('Errors and Echoes: Stopping error capture');
    
    window.removeEventListener('error', this.handleWindowError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Restore original console methods
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
    
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
      this.originalConsoleWarn = null;
    }
    
    this.isListening = false;
  }

  /**
   * Handle window.addEventListener('error') events
   * CRITICAL: NEVER preventDefault() - let the error continue normally
   */
  static handleWindowError(event) {
    try {
      this.handleError(event.error, { 
        source: 'javascript', 
        event,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }
    
    // CRITICAL: Never preventDefault() - let the error continue normal propagation
    // Users MUST see the error in console and dev tools
  }

  /**
   * Handle window.addEventListener('unhandledrejection') events
   * CRITICAL: NEVER preventDefault() - let the rejection continue normally
   */
  static handleUnhandledRejection(event) {
    try {
      this.handleError(event.reason, { 
        source: 'promise', 
        event,
        promise: event.promise
      });
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }
    
    // CRITICAL: Never preventDefault() - let the rejection continue normal propagation
    // Users MUST see the rejection in console and dev tools
  }

  /**
   * Central error handling - captures error for reporting while preserving normal flow
   */
  static async handleError(error, context) {
    // Only proceed if user has given consent
    if (!window.ErrorsAndEchoes?.ConsentManager?.hasConsent()) {
      return;
    }
    
    try {
      // Import modules dynamically to avoid circular dependencies
      const { ErrorAttribution } = await import('./error-attribution.js');
      const { ErrorReporter } = await import('./error-reporter.js');
      
      // Determine which module caused the error
      const attribution = ErrorAttribution.attributeToModule(error, context);
      
      // Find endpoint for this module
      const endpoint = this.getEndpointForModule(attribution.moduleId);
      
      if (endpoint) {
        ErrorReporter.sendReport(error, attribution, endpoint, context);
      }
    } catch (reportingError) {
      console.warn('Errors and Echoes: Error reporting failed:', reportingError);
    }
    
    // CRITICAL: Never swallow the original error
    // It continues normal propagation automatically
    // Users can still see it in console and dev tools
  }

  /**
   * Patch console.error to capture errors while preserving original behavior
   * CRITICAL: Call original first so user sees the error
   */
  static patchConsoleError() {
    if (this.originalConsoleError) return; // Already patched
    
    this.originalConsoleError = console.error;
    console.error = (...args) => {
      // CRITICAL: Call original first so user sees the error
      this.originalConsoleError.apply(console, args);
      
      // THEN try to report it
      try {
        if (args[0] instanceof Error) {
          this.handleError(args[0], { source: 'console', args });
        } else if (typeof args[0] === 'string' && args[0].toLowerCase().includes('error')) {
          // Create error from string message
          const error = new Error(args.join(' '));
          this.handleError(error, { source: 'console', args });
        }
      } catch (reportingError) {
        // Don't let reporting errors affect console.error
        // Silently fail to avoid infinite loops
      }
    };
  }

  /**
   * Patch console.warn to capture warnings while preserving original behavior
   * CRITICAL: Call original first so user sees the warning
   */
  static patchConsoleWarn() {
    if (this.originalConsoleWarn) return; // Already patched
    
    this.originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // CRITICAL: Call original first so user sees the warning
      this.originalConsoleWarn.apply(console, args);
      
      // THEN try to report it (only if it seems error-like)
      try {
        if (args[0] instanceof Error) {
          this.handleError(args[0], { source: 'console-warn', args });
        } else if (typeof args[0] === 'string' && 
                   (args[0].toLowerCase().includes('error') || 
                    args[0].toLowerCase().includes('failed') ||
                    args[0].toLowerCase().includes('exception'))) {
          // Create error from warning that seems error-like
          const error = new Error(args.join(' '));
          error.name = 'Warning';
          this.handleError(error, { source: 'console-warn', args });
        }
      } catch (reportingError) {
        // Don't let reporting errors affect console.warn
        // Silently fail to avoid infinite loops
      }
    };
  }

  /**
   * Patch Foundry hooks to capture errors during hook execution
   * CRITICAL: Don't interfere with hook execution or results
   */
  static patchFoundryHooks() {
    if (!window.Hooks) return;
    
    const originalCall = Hooks.call;
    const originalCallAll = Hooks.callAll;
    
    // Patch Hooks.call
    Hooks.call = function(hook, ...args) {
      try {
        return originalCall.call(this, hook, ...args);
      } catch (error) {
        // Let the error continue to propagate normally
        ErrorCapture.handleError(error, { 
          source: 'foundry-hook',
          hook,
          args: args.length // Don't include actual args for privacy
        });
        throw error; // CRITICAL: Re-throw so normal error handling continues
      }
    };
    
    // Patch Hooks.callAll
    Hooks.callAll = function(hook, ...args) {
      try {
        return originalCallAll.call(this, hook, ...args);
      } catch (error) {
        // Let the error continue to propagate normally
        ErrorCapture.handleError(error, { 
          source: 'foundry-hook-all',
          hook,
          args: args.length // Don't include actual args for privacy
        });
        throw error; // CRITICAL: Re-throw so normal error handling continues
      }
    };
  }

  /**
   * Get the endpoint configuration for a specific module
   */
  static getEndpointForModule(moduleId) {
    if (!game?.settings) return null;
    
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
}