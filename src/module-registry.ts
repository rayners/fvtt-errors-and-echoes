/**
 * Module Registry System
 *
 * Manages registration of modules for enhanced error reporting,
 * including context providers and error filters.
 */

export interface ModuleRegistrationConfig {
  moduleId: string;
  contextProvider?: () => Record<string, any>;
  errorFilter?: (error: Error) => boolean;
  endpoint?: EndpointConfig;
}

export interface EndpointConfig {
  name: string;
  url: string;
  author?: string;
  modules?: string[];
  enabled: boolean;
}

export interface RegisteredModule {
  moduleId: string;
  contextProvider?: (() => Record<string, any>) | undefined;
  errorFilter?: ((error: Error) => boolean) | undefined;
  endpoint?: EndpointConfig | undefined;
  registrationTime: string;
  lastContextCall?: string | undefined;
  contextCallCount: number;
  filterCallCount: number;
}

export class ModuleRegistry {
  private static registeredModules = new Map<string, RegisteredModule>();

  /**
   * Register a module for enhanced error reporting
   */
  static register(config: ModuleRegistrationConfig): void {
    const { moduleId, contextProvider, errorFilter, endpoint } = config;

    // Validate module exists
    const module = game.modules.get(moduleId);
    if (!module) {
      console.warn(`Errors and Echoes: Cannot register module '${moduleId}' - module not found`);
      return;
    }

    // Validate context provider if provided
    if (contextProvider && typeof contextProvider !== 'function') {
      console.warn(`Errors and Echoes: Context provider for '${moduleId}' must be a function`);
      return;
    }

    // Validate error filter if provided
    if (errorFilter && typeof errorFilter !== 'function') {
      console.warn(`Errors and Echoes: Error filter for '${moduleId}' must be a function`);
      return;
    }

    // Test context provider if provided
    if (contextProvider) {
      try {
        const testContext = contextProvider();
        if (typeof testContext !== 'object' || testContext === null) {
          console.warn(
            `Errors and Echoes: Context provider for '${moduleId}' must return an object`
          );
          return;
        }
      } catch (error) {
        console.warn(
          `Errors and Echoes: Context provider for '${moduleId}' threw an error during test:`,
          error
        );
        return;
      }
    }

    // Test error filter if provided
    if (errorFilter) {
      try {
        const testError = new Error('Test error');
        const result = errorFilter(testError);
        if (typeof result !== 'boolean') {
          console.warn(`Errors and Echoes: Error filter for '${moduleId}' must return a boolean`);
          return;
        }
      } catch (error) {
        console.warn(
          `Errors and Echoes: Error filter for '${moduleId}' threw an error during test:`,
          error
        );
        return;
      }
    }

    // Create registered module entry
    const registeredModule: RegisteredModule = {
      moduleId,
      contextProvider: contextProvider || undefined,
      errorFilter: errorFilter || undefined,
      endpoint: endpoint || undefined,
      registrationTime: new Date().toISOString(),
      lastContextCall: undefined,
      contextCallCount: 0,
      filterCallCount: 0,
    };

    this.registeredModules.set(moduleId, registeredModule);

    console.log(`Errors and Echoes: Module '${moduleId}' registered successfully`);
    console.log(`  - Context provider: ${contextProvider ? 'Yes' : 'No'}`);
    console.log(`  - Error filter: ${errorFilter ? 'Yes' : 'No'}`);
    console.log(`  - Custom endpoint: ${endpoint ? 'Yes' : 'No'}`);
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
      const context = registered.contextProvider();

      // Update statistics
      registered.contextCallCount++;
      registered.lastContextCall = new Date().toISOString();

      // Validate returned context
      if (typeof context !== 'object' || context === null) {
        console.warn(`Errors and Echoes: Context provider for '${moduleId}' returned invalid data`);
        return {};
      }

      return context;
    } catch (error) {
      console.warn(`Errors and Echoes: Context provider for '${moduleId}' threw an error:`, error);
      return {};
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
      console.log(`Errors and Echoes: Module '${moduleId}' unregistered`);
    }

    return wasRegistered;
  }

  /**
   * Clear all registrations (for testing/cleanup)
   */
  static clearAll(): void {
    const count = this.registeredModules.size;
    this.registeredModules.clear();
    console.log(`Errors and Echoes: Cleared ${count} module registrations`);
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
