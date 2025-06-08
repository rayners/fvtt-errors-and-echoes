/**
 * Error Attribution System
 *
 * Determines which module caused an error using various detection methods.
 * Uses stack trace analysis, hook context, pattern matching, and module registry.
 */

import { ModuleRegistry } from './module-registry.js';

interface ErrorContext {
  source: 'javascript' | 'promise' | 'console' | 'hook';
  event?: Event | PromiseRejectionEvent;
  hookName?: string;
  timestamp: number;
}

export interface Attribution {
  moduleId: string;
  confidence: 'high' | 'medium' | 'low' | 'none' | 'manual';
  method:
    | 'stack-trace'
    | 'hook-context'
    | 'pattern-match'
    | 'registry-context'
    | 'unknown'
    | 'api-call';
  source: string;
  domain?: string; // Functional domain of the error (e.g., 'time-calendar', 'ui-rendering')
}

interface DomainPattern {
  pattern: RegExp;
  domain: string;
  description: string;
}

export class ErrorAttribution {
  // Domain-based patterns for functional areas (more sustainable than module-specific patterns)
  private static domainPatterns: DomainPattern[] = [
    // Time and calendar related errors
    {
      pattern: /worldTime|game\.time|calendar|date.*conversion|time.*conversion/i,
      domain: 'time-calendar',
      description: 'Time and calendar system errors',
    },

    // UI and rendering errors
    {
      pattern: /widget|canvas|render|position|ui\.notifications|dialog/i,
      domain: 'ui-rendering',
      description: 'User interface and rendering errors',
    },

    // Database and document errors
    {
      pattern: /database|document|collection|actor|item|scene/i,
      domain: 'data-management',
      description: 'Data storage and document management errors',
    },

    // Hook and integration errors
    {
      pattern: /hook|integration|api|registration/i,
      domain: 'integration',
      description: 'Module integration and hook system errors',
    },

    // Audio/visual effects errors
    {
      pattern: /audio|sound|video|animation|effect/i,
      domain: 'media-effects',
      description: 'Audio/visual effects and media errors',
    },
  ];

  /**
   * Attribute an error to a specific module using multiple detection methods
   */
  static attributeToModule(error: Error, context: ErrorContext): Attribution {
    // Get domain information early for use as metadata
    const errorDomain = this.identifyErrorDomain(error);

    // Method 1: Stack trace analysis (highest confidence)
    const moduleFromStack = this.parseStackTrace(error.stack);
    if (moduleFromStack) {
      return {
        moduleId: moduleFromStack,
        confidence: 'high',
        method: 'stack-trace',
        source: context.source,
        domain: errorDomain,
      };
    }

    // Method 2: Hook context (medium confidence)
    if (context.source === 'hook') {
      const moduleFromHook = this.getModuleFromHookContext(context.hookName);
      if (moduleFromHook) {
        return {
          moduleId: moduleFromHook,
          confidence: 'medium',
          method: 'hook-context',
          source: context.source,
          domain: errorDomain,
        };
      }
    }

    // Method 2.5: Registry-based context analysis (medium confidence)
    const moduleFromRegistry = this.getModuleFromRegistry(error, context);
    if (moduleFromRegistry) {
      return {
        moduleId: moduleFromRegistry,
        confidence: 'medium',
        method: 'registry-context',
        source: context.source,
        domain: errorDomain,
      };
    }

    // Method 3: Current active module detection from call stack
    const moduleFromCallStack = this.getActiveModuleFromCallStack();
    if (moduleFromCallStack) {
      return {
        moduleId: moduleFromCallStack,
        confidence: 'medium',
        method: 'stack-trace',
        source: context.source,
        domain: errorDomain,
      };
    }

    // Default: unknown module (but include domain information as helpful metadata)
    return {
      moduleId: 'unknown',
      confidence: 'none',
      method: 'unknown',
      source: context.source,
      domain: errorDomain,
    };
  }

  /**
   * Parse stack trace to identify module using enhanced path detection
   */
  private static parseStackTrace(stack?: string): string | null {
    if (!stack) return null;

    // Method 1: Standard module path patterns
    const moduleMatch = stack.match(/\/modules\/([^/]+)\//);
    if (moduleMatch && moduleMatch[1]) {
      return moduleMatch[1];
    }

    // Method 2: Alternative patterns for different Foundry setups (Windows, development, etc.)
    const altModuleMatch = stack.match(/modules[/\\]([^/\\]+)[/\\]/);
    if (altModuleMatch && altModuleMatch[1]) {
      return altModuleMatch[1];
    }

    // Method 3: Browser file:// URLs (common in development)
    const fileUrlMatch = stack.match(/file:\/\/.*\/modules\/([^/]+)\//);
    if (fileUrlMatch && fileUrlMatch[1]) {
      return fileUrlMatch[1];
    }

    // Method 4: HTTP/HTTPS module URLs (common in hosted environments)
    const httpUrlMatch = stack.match(/https?:\/\/[^/]+\/modules\/([^/]+)\//);
    if (httpUrlMatch && httpUrlMatch[1]) {
      return httpUrlMatch[1];
    }

    // Method 5: Webpack/bundled module patterns (for built modules)
    const webpackMatch = stack.match(/webpack:\/\/\/\.\/modules\/([^/]+)\//);
    if (webpackMatch && webpackMatch[1]) {
      return webpackMatch[1];
    }

    // Method 6: Source map patterns (for TypeScript/compiled modules)
    const sourceMapMatch = stack.match(/\/([^/]+)\/dist\/[^/]*\.js/);
    if (sourceMapMatch && sourceMapMatch[1]) {
      // Verify this looks like a module ID (not a generic path like 'js' or 'dist')
      const potentialModule = sourceMapMatch[1];
      if (potentialModule.length > 2 && !['js', 'css', 'dist', 'src'].includes(potentialModule)) {
        return potentialModule;
      }
    }

    return null;
  }

  /**
   * Get module from hook context
   */
  private static getModuleFromHookContext(hookName?: string): string | null {
    if (!hookName) return null;

    // Check if we can determine module from current call stack
    const stack = new Error().stack;
    return this.parseStackTrace(stack);
  }

  /**
   * Get currently active module from call stack
   */
  private static getActiveModuleFromCallStack(): string | null {
    try {
      // Create a new stack trace to see where we're being called from
      const stack = new Error().stack;
      return this.parseStackTrace(stack);
    } catch {
      return null;
    }
  }

  /**
   * Get module from registry-based context analysis
   */
  private static getModuleFromRegistry(error: Error, _context: ErrorContext): string | null {
    // Get all registered modules and analyze which one might be responsible
    const registeredModules = ModuleRegistry.getAllRegisteredModules();

    if (registeredModules.length === 0) {
      return null;
    }

    // Analyze stack trace for module paths
    const moduleFromStack = this.parseStackTrace(error.stack);
    if (moduleFromStack && ModuleRegistry.isRegistered(moduleFromStack)) {
      // If we found a module in the stack trace and it's registered, check if it should be filtered
      if (ModuleRegistry.shouldFilterError(moduleFromStack, error)) {
        // Error should be filtered (not reported) for this module
        return null;
      }
      return moduleFromStack;
    }

    // If no specific module found in stack, check each registered module's error filter
    // to see if any of them should handle this error
    for (const registeredModule of registeredModules) {
      // Skip modules that would filter out this error
      if (ModuleRegistry.shouldFilterError(registeredModule.moduleId, error)) {
        continue;
      }

      // For now, we don't have a way to positively identify which module caused the error
      // without stack trace information, so we fall back to other methods
    }

    return null;
  }

  /**
   * Identify the functional domain of an error for metadata purposes
   */
  private static identifyErrorDomain(error: Error): string | undefined {
    const searchText = `${error.stack || ''} ${error.message || ''}`;

    for (const { pattern, domain } of this.domainPatterns) {
      if (pattern.test(searchText)) {
        return domain;
      }
    }

    return undefined;
  }

  /**
   * Add a new domain pattern for error classification
   */
  static addDomainPattern(pattern: RegExp, domain: string, description: string): void {
    this.domainPatterns.push({ pattern, domain, description });
  }

  /**
   * Remove a domain pattern
   */
  static removeDomainPattern(domain: string): void {
    this.domainPatterns = this.domainPatterns.filter(p => p.domain !== domain);
  }

  /**
   * Get all known domain patterns (for debugging)
   */
  static getDomainPatterns(): DomainPattern[] {
    return [...this.domainPatterns];
  }

  /**
   * Enhanced attribution with file and line information
   */
  static getDetailedAttribution(
    error: Error,
    context: ErrorContext
  ): Attribution & {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  } {
    const basicAttribution = this.attributeToModule(error, context);

    // Extract file and line information from stack trace
    const fileInfo = this.extractFileInfo(error.stack);

    return {
      ...basicAttribution,
      ...fileInfo,
    };
  }

  /**
   * Extract file, line, and column information from stack trace
   */
  private static extractFileInfo(stack?: string): {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  } {
    if (!stack) return {};

    try {
      // Parse first line of stack trace for file/line info
      const lines = stack.split('\n');
      for (const line of lines) {
        // Match patterns like "at file:///path/to/file.js:123:45"
        const match = line.match(/(?:at\s+)?.*?([^/\s]+\.js):(\d+):(\d+)/);
        if (match) {
          return {
            fileName: match[1],
            lineNumber: parseInt(match[2], 10),
            columnNumber: parseInt(match[3], 10),
          };
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return {};
  }

  /**
   * Confidence scoring based on attribution method and context
   */
  static calculateConfidenceScore(attribution: Attribution): number {
    let score = 0;

    // Base score by method
    switch (attribution.method) {
      case 'stack-trace':
        score += 0.8;
        break;
      case 'hook-context':
        score += 0.6;
        break;
      case 'pattern-match':
        score += 0.4;
        break;
      default:
        score += 0.1;
    }

    // Boost score for specific sources
    switch (attribution.source) {
      case 'javascript':
      case 'promise':
        score += 0.1;
        break;
      case 'hook':
        score += 0.05;
        break;
    }

    // Cap at 1.0
    return Math.min(score, 1.0);
  }
}
