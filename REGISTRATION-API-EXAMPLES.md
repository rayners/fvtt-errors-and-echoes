# Registration API Examples

This document provides examples of how to use the Errors and Echoes Registration API in your Foundry VTT modules.

## Basic Registration

```javascript
// Register your module with basic error reporting
game.modules.get('errors-and-echoes')?.api?.register({
  moduleId: 'my-awesome-module',
});
```

## Registration with Context Provider

```javascript
// Provide additional context for error reports
game.modules.get('errors-and-echoes')?.api?.register({
  moduleId: 'my-awesome-module',
  contextProvider: () => {
    return {
      currentScene: canvas.scene?.name || 'unknown',
      activeUsers: game.users.filter(u => u.active).length,
      myModuleSettings: {
        debugMode: game.settings.get('my-awesome-module', 'debugMode'),
        version: game.modules.get('my-awesome-module')?.version,
      },
    };
  },
});
```

## Registration with Error Filter

```javascript
// Filter out certain errors from being reported
game.modules.get('errors-and-echoes')?.api?.register({
  moduleId: 'my-awesome-module',
  errorFilter: error => {
    // Don't report errors that contain "debug" in the message
    if (error.message.includes('debug')) {
      return true; // true means "filter this error" (don't report)
    }

    // Don't report errors during development mode
    if (game.settings.get('my-awesome-module', 'developmentMode')) {
      return true;
    }

    return false; // false means "don't filter" (do report)
  },
});
```

## Registration with Custom Endpoint

```javascript
// Send errors to your own error reporting service
game.modules.get('errors-and-echoes')?.api?.register({
  moduleId: 'my-awesome-module',
  endpoint: {
    name: 'My Module Error Service',
    url: 'https://errors.mymodule.com/report',
    enabled: true,
  },
});
```

## Complete Registration Example

```javascript
// Full registration with all features
Hooks.once('init', () => {
  const errorsAndEchoes = game.modules.get('errors-and-echoes');
  if (!errorsAndEchoes?.api) {
    console.warn('Errors and Echoes not available for registration');
    return;
  }

  errorsAndEchoes.api.register({
    moduleId: 'my-awesome-module',

    // Provide rich context for debugging
    contextProvider: () => {
      const module = game.modules.get('my-awesome-module');
      return {
        moduleVersion: module?.version || 'unknown',
        activeScene: canvas.scene?.name,
        playerCount: game.users.filter(u => u.active).length,
        systemVersion: game.system.version,
        debugMode: game.settings.get('my-awesome-module', 'debug'),
        lastUserAction: window.myModuleLastAction || 'none',
        performanceMetrics: {
          memoryUsage: performance.memory?.usedJSHeapSize || 0,
          timing: performance.now(),
        },
      };
    },

    // Filter development and expected errors
    errorFilter: error => {
      // Don't report in development mode
      if (game.settings.get('my-awesome-module', 'developmentMode')) {
        return true;
      }

      // Don't report certain expected error types
      const ignoredMessages = ['Network timeout', 'User cancelled', 'Expected validation error'];

      return ignoredMessages.some(msg => error.message.includes(msg));
    },

    // Optional: Use custom endpoint for your organization
    endpoint: {
      name: 'My Organization Error Tracker',
      url: 'https://errors.myorganization.com/foundry/report',
      enabled: true,
    },
  });

  console.log('My Awesome Module registered with Errors and Echoes');
});
```

## Error Filtering Patterns

### Filter by Message Content

```javascript
errorFilter: error => {
  // Filter out specific error messages
  const ignoredMessages = ['timeout', 'cancelled', 'aborted'];
  return ignoredMessages.some(msg => error.message.toLowerCase().includes(msg));
};
```

### Filter by Development Mode

```javascript
errorFilter: error => {
  // Don't report any errors in development mode
  return game.settings.get('my-module', 'developmentMode');
};
```

### Filter by Error Type

```javascript
errorFilter: error => {
  // Only filter specific error types
  const filteredTypes = ['TypeError', 'ReferenceError'];
  return filteredTypes.includes(error.constructor.name);
};
```

### Filter by Stack Trace

```javascript
errorFilter: error => {
  // Filter errors from specific files or functions
  if (error.stack?.includes('third-party-library.js')) {
    return true; // Don't report third-party library errors
  }
  return false;
};
```

## Context Provider Patterns

### Basic Module Info

```javascript
contextProvider: () => ({
  moduleVersion: game.modules.get('my-module')?.version,
  foundryVersion: game.version,
  systemId: game.system.id,
});
```

### User Activity Context

```javascript
contextProvider: () => ({
  currentScene: canvas.scene?.name,
  activeLayer: canvas.activeLayer?.constructor.name,
  selectedTokens: canvas.tokens.controlled.length,
  gm: game.user.isGM,
  playerCount: game.users.filter(u => u.active).length,
});
```

### Module State Context

```javascript
contextProvider: () => {
  const settings = {};
  ['debugMode', 'autoSave', 'theme'].forEach(key => {
    settings[key] = game.settings.get('my-module', key);
  });

  return {
    settings,
    lastAction: window.myModuleState?.lastAction,
    initializationTime: window.myModuleState?.initTime,
    errorCount: window.myModuleState?.errorCount || 0,
  };
};
```

## Best Practices

### 1. Register During 'init' Hook

```javascript
Hooks.once('init', () => {
  // Register here to ensure Errors and Echoes is available
  game.modules.get('errors-and-echoes')?.api?.register(config);
});
```

### 2. Check for Availability

```javascript
const errorsAndEchoes = game.modules.get('errors-and-echoes');
if (errorsAndEchoes?.api?.register) {
  errorsAndEchoes.api.register(config);
} else {
  console.warn('Errors and Echoes not available');
}
```

### 3. Handle Context Provider Errors

```javascript
contextProvider: () => {
  try {
    return {
      // Your context logic here
      complexData: computeComplexData(),
    };
  } catch (error) {
    // Return minimal context if computation fails
    return {
      error: 'Context computation failed',
      timestamp: Date.now(),
    };
  }
};
```

### 4. Performance-Conscious Context

```javascript
contextProvider: () => {
  // Avoid expensive operations in context providers
  // They're called on every error report
  return {
    // Good: Simple property access
    currentScene: canvas.scene?.name,

    // Bad: Expensive computation
    // allTokenData: canvas.tokens.placeables.map(t => t.document.toObject())

    // Good: Cached or simple counts
    tokenCount: canvas.tokens.placeables.length,
  };
};
```

### 5. Meaningful Error Filtering

```javascript
errorFilter: error => {
  // Be specific about what you're filtering and why

  // Filter user-cancelled actions (not bugs)
  if (error.message.includes('User cancelled')) {
    return true;
  }

  // Filter known third-party issues
  if (error.stack?.includes('problematic-library.js')) {
    return true;
  }

  // Don't filter everything in development - you want to see real issues
  return false;
};
```

## TypeScript Usage

```typescript
import type { ModuleRegistrationConfig } from 'path/to/errors-and-echoes/types';

const config: ModuleRegistrationConfig = {
  moduleId: 'my-typed-module',
  contextProvider: (): Record<string, any> => ({
    version: '1.0.0',
    debug: true,
  }),
  errorFilter: (error: Error): boolean => {
    return error.message.includes('ignore');
  },
};

(game.modules.get('errors-and-echoes') as any)?.api?.register(config);
```
