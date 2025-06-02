/**
 * Error Attribution System
 * 
 * Analyzes errors to determine which module likely caused them.
 * Uses multiple strategies with confidence levels.
 */
export class ErrorAttribution {
  
  /**
   * Main attribution method - tries multiple strategies
   */
  static attributeToModule(error, context) {
    // Stack trace analysis (highest confidence)
    const moduleFromStack = this.parseStackTrace(error.stack);
    if (moduleFromStack) {
      return { 
        moduleId: moduleFromStack, 
        confidence: 'high',
        method: 'stack-trace',
        source: context.source
      };
    }

    // Hook context analysis (medium confidence)
    const moduleFromHook = this.getActiveHookModule(context);
    if (moduleFromHook) {
      return { 
        moduleId: moduleFromHook, 
        confidence: 'medium',
        method: 'hook-context',
        source: context.source
      };
    }

    // Function/class name patterns (low confidence)
    const moduleFromPattern = this.matchKnownPatterns(error);
    if (moduleFromPattern) {
      return { 
        moduleId: moduleFromPattern, 
        confidence: 'low',
        method: 'pattern-match',
        source: context.source
      };
    }

    // Foundry core detection
    if (this.isFoundryCore(error, context)) {
      return {
        moduleId: 'foundry-core',
        confidence: 'medium',
        method: 'core-detection',
        source: context.source
      };
    }

    // System detection
    const systemId = this.detectSystem(error, context);
    if (systemId) {
      return {
        moduleId: `system-${systemId}`,
        confidence: 'medium', 
        method: 'system-detection',
        source: context.source
      };
    }

    return { 
      moduleId: 'unknown', 
      confidence: 'none',
      method: 'no-attribution',
      source: context.source
    };
  }

  /**
   * Parse stack trace to find module references
   */
  static parseStackTrace(stack) {
    if (!stack) return null;
    
    // Look for module patterns in stack trace
    const modulePatterns = [
      // Standard module path: /modules/module-name/
      /\/modules\/([^\/\?\#]+)\//g,
      // File URLs: file:///modules/module-name/
      /file:\/\/\/.*\/modules\/([^\/\?\#]+)\//g,
      // HTTP URLs: http://localhost:30000/modules/module-name/
      /https?:\/\/[^\/]+\/modules\/([^\/\?\#]+)\//g
    ];

    for (const pattern of modulePatterns) {
      const matches = [...stack.matchAll(pattern)];
      if (matches.length > 0) {
        // Return the first module found (usually the most relevant)
        const moduleId = matches[0][1];
        
        // Filter out obvious non-modules
        if (this.isValidModuleId(moduleId)) {
          return moduleId;
        }
      }
    }

    return null;
  }

  /**
   * Check if we're currently in a hook execution and determine the module
   */
  static getActiveHookModule(context) {
    if (context.source === 'foundry-hook' || context.source === 'foundry-hook-all') {
      // Try to get module from current call stack
      const stack = new Error().stack;
      return this.parseStackTrace(stack);
    }
    
    return null;
  }

  /**
   * Match known patterns in error messages/stack traces to modules
   */
  static matchKnownPatterns(error) {
    const patterns = [
      // Journeys and Jamborees patterns
      { 
        pattern: /PartyActor|PartySheet|PartyModel|JourneysAndJamborees/i, 
        module: 'journeys-and-jamborees' 
      },
      
      // Realms and Reaches patterns
      { 
        pattern: /RealmManager|BiomeLayer|RealmsAndReaches|RealmDocument/i, 
        module: 'realms-and-reaches' 
      },
      
      // Seasons and Stars patterns
      { 
        pattern: /SeasonsAndStars|CalendarWidget|CalendarEngine/i, 
        module: 'seasons-and-stars' 
      },
      
      // Simple Calendar patterns
      { 
        pattern: /SimpleCalendar|SC\.|SimpleCalendarAPI/i, 
        module: 'foundryvtt-simple-calendar' 
      },
      
      // Enhanced Combat HUD patterns
      { 
        pattern: /EnhancedCombatHUD|ECHUD|PortraitPanel/i, 
        module: 'enhancedcombathud' 
      },
      
      // Common system patterns
      { 
        pattern: /dnd5e|DND5E|Actor5e|Item5e/i, 
        module: 'system-dnd5e' 
      },
      { 
        pattern: /pf2e|PF2E|ActorPF2e|ItemPF2e/i, 
        module: 'system-pf2e' 
      },
      { 
        pattern: /dragonbane|DRAGONBANE|DragonbaneActor/i, 
        module: 'system-dragonbane' 
      },
      
      // Add more patterns as we discover common module signatures
    ];

    const searchText = `${error.message} ${error.stack || ''}`;
    
    for (const { pattern, module } of patterns) {
      if (pattern.test(searchText)) {
        return module;
      }
    }

    return null;
  }

  /**
   * Check if this looks like a Foundry core error
   */
  static isFoundryCore(error, context) {
    const stack = error.stack || '';
    const message = error.message || '';
    
    // Foundry core paths
    const corePatterns = [
      /\/resources\/app\/public\/scripts\//,
      /\/resources\/app\/client\//,
      /foundry\.js/,
      /\/common\/utils/,
      /\/client\/apps\//,
      /\/client\/core\//,
      /Application\.js/,
      /DocumentSheet\.js/,
      /FormApplication\.js/
    ];

    // Check if stack trace contains core paths
    for (const pattern of corePatterns) {
      if (pattern.test(stack)) {
        return true;
      }
    }

    // Common Foundry core error messages
    const coreErrorPatterns = [
      /You are not currently connected to the game session/,
      /The requested resource does not exist/,
      /Permission denied/,
      /Document.*does not exist/,
      /Invalid.*argument provided/,
      /Socket connection lost/
    ];

    for (const pattern of coreErrorPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Try to detect if error is from a game system
   */
  static detectSystem(error, context) {
    const stack = error.stack || '';
    
    // System path patterns
    const systemMatch = stack.match(/\/systems\/([^\/\?\#]+)\//);
    if (systemMatch) {
      return systemMatch[1];
    }

    // If we have game context, check the current system
    if (typeof game !== 'undefined' && game.system) {
      const systemId = game.system.id;
      
      // Check if error mentions system-specific classes/functions
      const systemPatterns = {
        'dnd5e': /Actor5e|Item5e|dnd5e/i,
        'pf2e': /ActorPF2e|ItemPF2e|pf2e/i,
        'dragonbane': /DragonbaneActor|DragonbaneItem|dragonbane/i,
        'forbidden-lands': /ForbiddenLandsActor|ForbiddenLandsItem/i
      };

      const pattern = systemPatterns[systemId];
      if (pattern && pattern.test(`${error.message} ${stack}`)) {
        return systemId;
      }
    }

    return null;
  }

  /**
   * Validate that a module ID looks legitimate
   */
  static isValidModuleId(moduleId) {
    if (!moduleId || typeof moduleId !== 'string') return false;
    
    // Filter out obvious non-modules
    const invalidIds = [
      'scripts', 'styles', 'lang', 'templates', 'assets', 'css', 'js',
      'dist', 'src', 'lib', 'node_modules', 'fonts', 'images', 'sounds',
      'public', 'static', 'build', 'webpack', 'rollup'
    ];
    
    if (invalidIds.includes(moduleId.toLowerCase())) {
      return false;
    }
    
    // Must look like a reasonable module ID
    if (!/^[a-z0-9\-_]+$/.test(moduleId)) {
      return false;
    }
    
    // Too short or too long
    if (moduleId.length < 3 || moduleId.length > 50) {
      return false;
    }
    
    return true;
  }

  /**
   * Get additional context information for debugging
   */
  static getContextInfo(context) {
    const info = {
      source: context.source,
      timestamp: new Date().toISOString()
    };

    // Add context-specific information
    if (context.filename) {
      info.filename = context.filename;
    }
    
    if (context.hook) {
      info.hook = context.hook;
    }
    
    if (context.lineno) {
      info.line = context.lineno;
    }
    
    if (context.colno) {
      info.column = context.colno;
    }

    return info;
  }
}