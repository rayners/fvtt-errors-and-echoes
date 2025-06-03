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
  confidence: 'high' | 'medium' | 'low' | 'none';
  method: 'stack-trace' | 'hook-context' | 'pattern-match' | 'registry-context' | 'unknown';
  source: string;
}

interface ModulePattern {
  pattern: RegExp;
  module: string;
}

export class ErrorAttribution {
  
  // Known patterns for common modules (can be extended)
  private static modulePatterns: ModulePattern[] = [
    { pattern: /PartyActor|PartySheet|PartyModel/, module: 'journeys-and-jamborees' },
    { pattern: /RealmManager|BiomeLayer/, module: 'realms-and-reaches' },
    { pattern: /CalendarWidget|CalendarEngine/, module: 'seasons-and-stars' },
    { pattern: /ErrorCapture|ErrorReporter|ConsentManager/, module: 'errors-and-echoes' },
    // Add more patterns as needed
  ];

  /**
   * Attribute an error to a specific module using multiple detection methods
   */
  static attributeToModule(error: Error, context: ErrorContext): Attribution {
    // Method 1: Stack trace analysis (highest confidence)
    const moduleFromStack = this.parseStackTrace(error.stack);
    if (moduleFromStack) {
      return { 
        moduleId: moduleFromStack, 
        confidence: 'high',
        method: 'stack-trace',
        source: context.source
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
          source: context.source
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
        source: context.source
      };
    }

    // Method 3: Pattern matching (low confidence)
    const moduleFromPattern = this.matchKnownPatterns(error);
    if (moduleFromPattern) {
      return { 
        moduleId: moduleFromPattern, 
        confidence: 'low',
        method: 'pattern-match',
        source: context.source
      };
    }

    // Method 4: Current active module detection
    const moduleFromCallStack = this.getActiveModuleFromCallStack();
    if (moduleFromCallStack) {
      return { 
        moduleId: moduleFromCallStack, 
        confidence: 'medium',
        method: 'stack-trace',
        source: context.source
      };
    }

    // Default: unknown module
    return { 
      moduleId: 'unknown', 
      confidence: 'none',
      method: 'unknown',
      source: context.source
    };
  }

  /**
   * Parse stack trace to identify module
   */
  private static parseStackTrace(stack?: string): string | null {
    if (!stack) return null;

    // Look for module patterns in stack trace
    const moduleMatch = stack.match(/\/modules\/([^\/]+)\//);
    if (moduleMatch && moduleMatch[1]) {
      return moduleMatch[1];
    }

    // Alternative patterns for different Foundry setups
    const altModuleMatch = stack.match(/modules[\/\\]([^\/\\]+)[\/\\]/);
    if (altModuleMatch && altModuleMatch[1]) {
      return altModuleMatch[1];
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Match known patterns to identify modules
   */
  private static matchKnownPatterns(error: Error): string | null {
    const searchText = `${error.stack || ''} ${error.message || ''}`;
    
    for (const { pattern, module } of this.modulePatterns) {
      if (pattern.test(searchText)) {
        return module;
      }
    }

    return null;
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
   * Add a new pattern for module detection
   */
  static addModulePattern(pattern: RegExp, moduleId: string): void {
    this.modulePatterns.push({ pattern, module: moduleId });
  }

  /**
   * Remove a pattern for module detection
   */
  static removeModulePattern(moduleId: string): void {
    this.modulePatterns = this.modulePatterns.filter(p => p.module !== moduleId);
  }

  /**
   * Get all known module patterns (for debugging)
   */
  static getModulePatterns(): ModulePattern[] {
    return [...this.modulePatterns];
  }

  /**
   * Enhanced attribution with file and line information
   */
  static getDetailedAttribution(error: Error, context: ErrorContext): Attribution & {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  } {
    const basicAttribution = this.attributeToModule(error, context);
    
    // Extract file and line information from stack trace
    const fileInfo = this.extractFileInfo(error.stack);
    
    return {
      ...basicAttribution,
      ...fileInfo
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
        const match = line.match(/(?:at\s+)?.*?([^\/\s]+\.js):(\d+):(\d+)/);
        if (match) {
          return {
            fileName: match[1],
            lineNumber: parseInt(match[2], 10),
            columnNumber: parseInt(match[3], 10)
          };
        }
      }
    } catch (error) {
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