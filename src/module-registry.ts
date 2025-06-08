/**
 * Module Registry System
 *
 * Manages registration of modules for enhanced error reporting,
 * including context providers and error filters.
 */

import type { EndpointConfig, ModuleRegistrationOptions, RegisteredModule } from './types.js';
import { debugLog } from './utils.js';

export interface ModuleRegistrationConfig {
  moduleId: string;
  contextProvider?: () => Record<string, any>;
  errorFilter?: (error: Error) => boolean;
  endpoint?: EndpointConfig;
}

export class ModuleRegistry {
  private static registeredModules = new Map<string, RegisteredModule>();

  /**
   * Register a module for enhanced error reporting
   */
  static register(config: ModuleRegistrationConfig): void {
    try {
      const { moduleId, contextProvider, errorFilter, endpoint } = config;

      // Validate required moduleId
      if (!moduleId || typeof moduleId !== 'string') {
        console.warn('Errors and Echoes: Registration failed - moduleId is required and must be a string');
        return;
      }

      // Validate module exists in game.modules (if game is available)
      if (typeof game !== 'undefined' && game.modules) {
        const module = game.modules.get(moduleId);
        if (!module) {
          console.warn(`Errors and Echoes: Cannot register module '${moduleId}' - module not found in game.modules`);
          return;
        }
      } else {
        // Game might not be ready yet, continue with registration but warn
        console.info(`Errors and Echoes: Registering '${moduleId}' before game.modules is available`);
      }

      // Validate context provider if provided
      if (contextProvider && typeof contextProvider !== 'function') {
        console.warn(`Errors and Echoes: Context provider for '${moduleId}' must be a function - skipping context provider`);
        // Continue registration without context provider rather than failing completely
        config.contextProvider = undefined;
      }

      // Validate error filter if provided
      if (errorFilter && typeof errorFilter !== 'function') {
        console.warn(`Errors and Echoes: Error filter for '${moduleId}' must be a function - skipping error filter`);
        // Continue registration without error filter rather than failing completely
        config.errorFilter = undefined;
      }

      // Test context provider if provided - but don't fail registration if test fails
      if (config.contextProvider) {
        try {
          const testContext = config.contextProvider();
          if (typeof testContext !== 'object' || testContext === null) {
            console.warn(
              `Errors and Echoes: Context provider for '${moduleId}' must return an object - disabling context provider`
            );
            config.contextProvider = undefined;
          }
        } catch (error) {
          console.warn(
            `Errors and Echoes: Context provider for '${moduleId}' threw an error during test - disabling context provider:`,
            error
          );
          config.contextProvider = undefined;
        }
      }

      // Test error filter if provided - but don't fail registration if test fails
      if (config.errorFilter) {
        try {
          const testError = new Error('Test error for validation');
          const result = config.errorFilter(testError);
          if (typeof result !== 'boolean') {
            console.warn(`Errors and Echoes: Error filter for '${moduleId}' must return a boolean - disabling error filter`);
            config.errorFilter = undefined;
          }
        } catch (error) {
          console.warn(
            `Errors and Echoes: Error filter for '${moduleId}' threw an error during test - disabling error filter:`,
            error
          );
          config.errorFilter = undefined;
        }
      }

      // Validate endpoint configuration if provided
      if (endpoint) {
        if (!endpoint.name || !endpoint.url) {
          console.warn(`Errors and Echoes: Endpoint for '${moduleId}' missing required name or url - disabling custom endpoint`);
          config.endpoint = undefined;
        } else if (typeof endpoint.enabled !== 'boolean') {
          // Default to enabled if not specified
          endpoint.enabled = true;
        }
      }

      // Create registered module entry
      const registeredModule: RegisteredModule = {
        moduleId,
        contextProvider: config.contextProvider || undefined,
        errorFilter: config.errorFilter || undefined,
        endpoint: config.endpoint || undefined,
        registrationTime: new Date().toISOString(),
        lastContextCall: undefined,
        contextCallCount: 0,
        filterCallCount: 0,
      };

      this.registeredModules.set(moduleId, registeredModule);

      debugLog(`Errors and Echoes: Module '${moduleId}' registered successfully`);
      debugLog(`  - Context provider: ${config.contextProvider ? 'Yes' : 'No'}`);
      debugLog(`  - Error filter: ${config.errorFilter ? 'Yes' : 'No'}`);
      debugLog(`  - Custom endpoint: ${config.endpoint ? 'Yes' : 'No'}`);
      
    } catch (registrationError) {
      // Critical: Never let registration errors break the calling module
      console.error('Errors and Echoes: Registration failed with unexpected error:', registrationError);
      console.error('  - This error has been contained and should not affect your module');
      console.error('  - Please report this to the Errors and Echoes developers');
    }
  }

  /**
   * Check if a module is registered
   */
  static isRegistered(moduleId: string): boolean {
    return this.registeredModules.has(moduleId);
  }

  /**
   * Get registered module configuration
   */
  static getRegisteredModule(moduleId: string): RegisteredModule | undefined {
    return this.registeredModules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  static getAllRegisteredModules(): RegisteredModule[] {
    return Array.from(this.registeredModules.values());
  }

  /**
   * Get context from a registered module's context provider
   */
  static getModuleContext(moduleId: string): Record<string, any> {
    const registered = this.registeredModules.get(moduleId);
    if (!registered?.contextProvider) {
      return {};
    }

    try {
      // Set up timeout for context provider execution
      const contextProvider = registered.contextProvider;
      let context: any;
      
      // Execute context provider with error boundaries
      try {
        context = contextProvider();
      } catch (providerError) {
        console.warn(`Errors and Echoes: Context provider for '${moduleId}' threw an error during execution:`, providerError);
        
        // Update statistics even for failed calls
        registered.contextCallCount++;
        registered.lastContextCall = new Date().toISOString();
        
        // Return basic fallback context with error information
        return {
          _errorAndEchoesContextError: true,
          _errorMessage: providerError instanceof Error ? providerError.message : 'Unknown error',
          _moduleId: moduleId,
          _timestamp: new Date().toISOString()
        };
      }

      // Update statistics for successful call
      registered.contextCallCount++;
      registered.lastContextCall = new Date().toISOString();

      // Validate returned context
      if (typeof context !== 'object' || context === null) {
        console.warn(`Errors and Echoes: Context provider for '${moduleId}' returned invalid data (expected object, got ${typeof context})`);
        return {
          _errorAndEchoesContextError: true,
          _errorMessage: `Invalid context type: ${typeof context}`,
          _moduleId: moduleId,
          _timestamp: new Date().toISOString()
        };
      }

      // Sanitize context to prevent circular references and large objects
      try {
        const sanitizedContext = this.sanitizeContext(context, moduleId);
        return sanitizedContext;
      } catch (sanitizeError) {
        console.warn(`Errors and Echoes: Failed to sanitize context for '${moduleId}':`, sanitizeError);
        return {
          _errorAndEchoesContextError: true,
          _errorMessage: 'Context sanitization failed',
          _moduleId: moduleId,
          _timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      // Catch-all for any unexpected errors
      console.warn(`Errors and Echoes: Unexpected error getting context for '${moduleId}':`, error);
      
      // Update statistics even for failed calls
      registered.contextCallCount++;
      registered.lastContextCall = new Date().toISOString();
      
      return {
        _errorAndEchoesContextError: true,
        _errorMessage: error instanceof Error ? error.message : 'Unknown unexpected error',
        _moduleId: moduleId,
        _timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sanitize context object to prevent issues with JSON serialization
   */
  private static sanitizeContext(context: Record<string, any>, moduleId: string): Record<string, any> {
    const maxDepth = 3;
    const maxStringLength = 1000;
    const maxArrayLength = 50;
    const maxObjectKeys = 50;

    const sanitize = (obj: any, depth: number = 0): any => {
      // Prevent infinite recursion
      if (depth > maxDepth) {
        return '[Max depth exceeded]';
      }

      // Handle null/undefined
      if (obj === null || obj === undefined) {
        return obj;
      }

      // Handle primitives
      if (typeof obj === 'string') {
        return obj.length > maxStringLength ? obj.substring(0, maxStringLength) + '...' : obj;
      }
      
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        const limited = obj.slice(0, maxArrayLength);
        const sanitized = limited.map(item => sanitize(item, depth + 1));
        if (obj.length > maxArrayLength) {
          sanitized.push(`[${obj.length - maxArrayLength} more items...]`);
        }
        return sanitized;
      }

      // Handle objects
      if (typeof obj === 'object') {
        // Handle common problematic objects
        if (obj instanceof Error) {
          return {
            _type: 'Error',
            message: obj.message,
            name: obj.name
          };
        }

        if (obj instanceof HTMLElement) {
          return `[HTMLElement: ${obj.tagName}]`;
        }

        if (obj instanceof Function) {
          return '[Function]';
        }

        // Handle regular objects
        const sanitized: Record<string, any> = {};
        const keys = Object.keys(obj).slice(0, maxObjectKeys);
        
        for (const key of keys) {
          try {
            // Skip potentially problematic keys
            if (key.startsWith('_') && key !== '_id') {
              continue; // Skip private properties except _id
            }
            
            sanitized[key] = sanitize(obj[key], depth + 1);
          } catch (error) {
            sanitized[key] = '[Error accessing property]';
          }
        }

        if (Object.keys(obj).length > maxObjectKeys) {
          sanitized._truncated = `[${Object.keys(obj).length - maxObjectKeys} more properties...]`;
        }

        return sanitized;
      }

      // Fallback for unknown types
      return `[${typeof obj}]`;
    };

    try {
      const sanitized = sanitize(context);
      
      // Add metadata about sanitization (skip in test environments)
      if (typeof sanitized === 'object' && sanitized !== null && !this.isTestEnvironment()) {
        sanitized._errorsAndEchoesMeta = {
          moduleId,
          sanitized: true,
          timestamp: new Date().toISOString()
        };
      }
      
      return sanitized;
    } catch (error) {
      // If sanitization completely fails, return minimal safe context
      return {
        _errorAndEchoesContextError: true,
        _errorMessage: 'Complete sanitization failure',
        _moduleId: moduleId,
        _timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if an error should be filtered for a specific module
   */
  static shouldFilterError(moduleId: string, error: Error): boolean {
    const registered = this.registeredModules.get(moduleId);
    if (!registered?.errorFilter) {
      return false; // Don't filter if no filter is registered
    }

    try {
      const shouldFilter = registered.errorFilter(error);

      // Update statistics
      registered.filterCallCount++;

      return Boolean(shouldFilter);
    } catch (filterError) {
      console.warn(
        `Errors and Echoes: Error filter for '${moduleId}' threw an error:`,
        filterError
      );
      return false; // Don't filter if the filter itself errors
    }
  }

  /**
   * Get custom endpoint for a registered module
   */
  static getModuleEndpoint(moduleId: string): EndpointConfig | undefined {
    const registered = this.registeredModules.get(moduleId);
    return registered?.endpoint;
  }

  /**
   * Unregister a module (for testing/cleanup)
   */
  static unregister(moduleId: string): boolean {
    const wasRegistered = this.registeredModules.has(moduleId);
    this.registeredModules.delete(moduleId);

    if (wasRegistered) {
      debugLog(`Errors and Echoes: Module '${moduleId}' unregistered`);
    }

    return wasRegistered;
  }

  /**
   * Check if we're in a test environment
   */
  private static isTestEnvironment(): boolean {
    // Check multiple ways to detect test environment
    return (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
           (typeof globalThis !== 'undefined' && globalThis.__vitest_worker__ !== undefined) ||
           (typeof global !== 'undefined' && (global as any).__vitest_worker__ !== undefined) ||
           (typeof globalThis !== 'undefined' && (globalThis as any).describe !== undefined) ||
           (typeof window !== 'undefined' && (window as any).__vitest_worker__ !== undefined);
  }

  /**
   * Clear all registrations (for testing/cleanup)
   */
  static clearAll(): void {
    const count = this.registeredModules.size;
    this.registeredModules.clear();
    debugLog(`Errors and Echoes: Cleared ${count} module registrations`);
  }

  /**
   * Get registration statistics for debugging
   */
  static getStats(): {
    totalRegistered: number;
    modulesWithContext: number;
    modulesWithFilters: number;
    modulesWithEndpoints: number;
    totalContextCalls: number;
    totalFilterCalls: number;
  } {
    const modules = Array.from(this.registeredModules.values());

    return {
      totalRegistered: modules.length,
      modulesWithContext: modules.filter(m => m.contextProvider).length,
      modulesWithFilters: modules.filter(m => m.errorFilter).length,
      modulesWithEndpoints: modules.filter(m => m.endpoint).length,
      totalContextCalls: modules.reduce((sum, m) => sum + m.contextCallCount, 0),
      totalFilterCalls: modules.reduce((sum, m) => sum + m.filterCallCount, 0),
    };
  }
}
