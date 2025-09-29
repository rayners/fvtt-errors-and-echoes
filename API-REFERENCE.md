# API Reference - Errors and Echoes

Complete API reference for integrating with the Errors and Echoes error reporting module.

**Target Platform**: FoundryVTT v13+ (minimum v12.0.0, verified v13.0.0)

## Table of Contents

1. [Main API Interface](#main-api-interface)
2. [Module Registration](#module-registration)
3. [Error Reporting](#error-reporting)
4. [Manual Bug Submission](#manual-bug-submission)
5. [Consent Management](#consent-management)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Testing and Debugging](#testing-and-debugging)
8. [Error Handling](#error-handling)
9. [Integration Examples](#integration-examples)

## Main API Interface

Access the API via the module instance:

```javascript
const errorReporter = game.modules.get('errors-and-echoes');
const api = errorReporter?.active ? errorReporter.api : null;
```

### ErrorsAndEchoesAPI

```typescript
interface ErrorsAndEchoesAPI {
  register(config: ModuleRegistrationConfig): void;
  report(error: Error, options?: ReportOptions): void;
  submitBug(bugReport: BugReportSubmission): void;
  hasConsent(): boolean;
  getPrivacyLevel(): PrivacyLevel;
  getStats(): ReportStats;
}
```

## Module Registration

### `api.register(config: ModuleRegistrationConfig): void`

Register your module for enhanced error reporting with automatic attribution and context.

#### Parameters

```typescript
interface ModuleRegistrationConfig {
  moduleId: string; // Required: Your module's ID
  contextProvider?: () => Record<string, any>; // Optional: Context provider function
  errorFilter?: (error: Error) => boolean; // Optional: Error filter function
  endpoint?: EndpointConfig; // Optional: Custom endpoint config
}
```

#### Usage Examples

**Basic Registration:**

```javascript
Hooks.once('init', () => {
  const errorReporter = game.modules.get('errors-and-echoes');
  if (errorReporter?.active && errorReporter.api) {
    errorReporter.api.register({
      moduleId: 'my-awesome-module',
    });
  }
});
```

**Advanced Registration with Context:**

```javascript
errorReporter.api.register({
  moduleId: 'my-awesome-module',

  // Provide debugging context when errors occur
  contextProvider: () => ({
    // Module state
    version: game.modules.get('my-awesome-module')?.version,
    settingsState: {
      enableFeatureX: game.settings.get('my-awesome-module', 'enableFeatureX'),
      debugMode: game.settings.get('my-awesome-module', 'debugMode'),
    },

    // Current scene context (Foundry v13+ canvas API)
    scene: {
      name: canvas.scene?.name,
      tokenCount: canvas.scene?.tokens?.size || 0,
      isActive: canvas.scene?.active || false,
    },

    // User context (no PII)
    user: {
      isGM: game.user.isGM,
      role: game.user.role,
    },
  }),

  // Filter which errors to report
  errorFilter: error => {
    // Don't report network timeouts
    if (error.message.includes('NetworkError')) return false;

    // Don't report errors from other modules
    if (error.stack && !error.stack.includes('/modules/my-awesome-module/')) return false;

    // Don't report expected validation errors
    if (error.message.startsWith('Validation failed:')) return false;

    return true;
  },
});
```

**Custom Endpoint Registration:**

```javascript
errorReporter.api.register({
  moduleId: 'my-awesome-module',
  endpoint: {
    name: 'My Awesome Module Errors',
    url: 'https://errors.my-domain.com/report/my-awesome-module',
    author: 'my-github-username',
    modules: ['my-awesome-module', 'my-other-module'],
    enabled: true,
  },
});
```

#### Context Provider Best Practices

**✅ DO Include:**

- Module version and settings state
- Current scene/canvas state (non-sensitive)
- User role (GM/Player) but not username
- Feature flags and configuration
- Relevant game state for debugging

**❌ DON'T Include:**

- Usernames or email addresses
- IP addresses or network information
- Chat message content
- Player character sheet data
- Any personally identifiable information

#### Error Filter Guidelines

```javascript
const errorFilter = error => {
  // Performance: Quick rejection checks first
  if (error.message.length < 5) return false;

  // Module scope: Only report errors from your module
  if (error.stack && !error.stack.includes('/modules/my-module/')) {
    return false;
  }

  // Error types: Filter out expected errors
  const ignoredPatterns = [
    /Permission denied/,
    /Network timeout/,
    /User cancelled/,
    /Validation error:/,
  ];

  return !ignoredPatterns.some(pattern => pattern.test(error.message));
};
```

## Error Reporting

### `api.report(error: Error, options?: ReportOptions): void`

Manually report an error with additional context.

#### Parameters

```typescript
interface ReportOptions {
  module?: string; // Override detected module ID
  context?: Record<string, any>; // Additional context for this error
}
```

#### Usage Examples

**Basic Error Reporting:**

```javascript
try {
  await performRiskyOperation();
} catch (error) {
  // Report the error
  const errorReporter = game.modules.get('errors-and-echoes');
  if (errorReporter?.active && errorReporter.api) {
    errorReporter.api.report(error);
  }

  // Still handle the error normally
  ui.notifications.error('Operation failed');
  throw error; // Re-throw if needed
}
```

**Enhanced Error Reporting with Context:**

```javascript
async function updateTokenPosition(tokenId, newPosition) {
  try {
    const token = canvas.tokens.get(tokenId);
    if (!token) throw new Error(`Token not found: ${tokenId}`);

    await token.document.update(newPosition);
  } catch (error) {
    // Report with rich context
    errorReporter.api.report(error, {
      module: 'my-awesome-module',
      context: {
        operation: 'updateTokenPosition',
        tokenId,
        newPosition,
        sceneId: canvas.scene?.id,
        userAction: 'drag-drop',
        timestamp: Date.now(),

        // Foundry v13+ specific context
        canvasReady: canvas.ready,
        tokensLayer: canvas.tokens.active,
      },
    });

    throw error;
  }
}
```

**Async Error Boundary Pattern:**

```javascript
class ModuleFeature {
  async withErrorReporting(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      errorReporter.api.report(error, {
        module: this.moduleId,
        context: {
          ...context,
          feature: this.constructor.name,
          timestamp: Date.now(),
        },
      });

      throw error; // Re-throw for normal error handling
    }
  }

  async performComplexOperation() {
    return this.withErrorReporting(() => this.doComplexWork(), {
      operation: 'performComplexOperation',
    });
  }
}
```

## Manual Bug Submission

### `api.submitBug(bugReport: BugReportSubmission): void`

Submit a manual bug report with user-provided description and reproduction steps. This allows users to provide detailed context about issues they've encountered, even if those issues don't generate automatic error reports.

#### Parameters

```typescript
interface BugReportSubmission {
  title: string; // Brief title/summary (required)
  description: string; // User description of the bug (required)
  stepsToReproduce?: string; // Optional steps to reproduce
  expectedBehavior?: string; // What should happen
  actualBehavior?: string; // What actually happens
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'functionality' | 'performance' | 'integration' | 'other';
  module?: string; // Override module detection
  context?: Record<string, any>; // Additional context
}
```

#### Usage Examples

**Basic Bug Submission:**

```javascript
const errorReporter = game.modules.get('errors-and-echoes');
if (errorReporter?.active && errorReporter.api) {
  errorReporter.api.submitBug({
    title: 'Token movement not working',
    description: 'When I try to move my character token, it snaps back to the original position.',
    stepsToReproduce:
      '1. Select token\n2. Drag to new position\n3. Release mouse\n4. Token snaps back',
    expectedBehavior: 'Token should stay in the new position',
    actualBehavior: 'Token returns to original position',
    severity: 'medium',
    category: 'functionality',
  });
}
```

**Detailed Bug Report with Context:**

```javascript
function submitDetailedBugReport() {
  const currentScene = canvas.scene?.name || 'unknown';
  const selectedTokens = canvas.tokens.controlled.map(t => t.name);

  errorReporter.api.submitBug({
    title: 'Combat tracker not updating initiative',
    description: 'The combat tracker shows incorrect initiative order after adding new combatants.',
    stepsToReproduce:
      '1. Start combat encounter\n' +
      '2. Roll initiative for existing combatants\n' +
      '3. Add new combatant mid-combat\n' +
      '4. Roll initiative for new combatant\n' +
      '5. Notice incorrect ordering',
    expectedBehavior: 'New combatant should be inserted in correct initiative order',
    actualBehavior: 'New combatant appears at bottom regardless of initiative roll',
    severity: 'high',
    category: 'functionality',
    module: 'my-combat-module',
    context: {
      sceneId: canvas.scene?.id,
      sceneName: currentScene,
      selectedTokens,
      combatActive: game.combat?.active || false,
      combatRound: game.combat?.round || 0,
      timestamp: Date.now(),
      foundryVersion: game.version,
      systemId: game.system.id,
    },
  });
}
```

**User Feedback Integration:**

```javascript
// In a settings dialog or feedback form
class BugReportDialog extends Dialog {
  static async show() {
    return new BugReportDialog({
      title: 'Report a Bug',
      content: await renderTemplate('modules/my-module/templates/bug-report.html'),
      buttons: {
        submit: {
          icon: '<i class="fas fa-bug"></i>',
          label: 'Submit Bug Report',
          callback: html => this.submitReport(html),
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
        },
      },
    }).render(true);
  }

  static submitReport(html) {
    const formData = new FormData(html[0].querySelector('form'));

    const errorReporter = game.modules.get('errors-and-echoes');
    if (errorReporter?.active && errorReporter.api) {
      errorReporter.api.submitBug({
        title: formData.get('title'),
        description: formData.get('description'),
        stepsToReproduce: formData.get('steps'),
        expectedBehavior: formData.get('expected'),
        actualBehavior: formData.get('actual'),
        severity: formData.get('severity'),
        category: formData.get('category'),
        context: {
          reportedBy: game.user.name,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        },
      });

      ui.notifications.info('Bug report submitted. Thank you for your feedback!');
    }
  }
}
```

#### Best Practices

**Required Fields:**

- Always provide meaningful `title` and `description`
- Title should be concise but descriptive
- Description should explain the issue clearly

**Optional Enhancement:**

- Include `stepsToReproduce` when possible - this is extremely valuable for debugging
- Set appropriate `severity` to help prioritize issues
- Use `category` to help organize different types of issues

**Context Enrichment:**

- Add relevant context about the current game state
- Include information about what the user was doing when the issue occurred
- Provide version information for system and modules when relevant

**Privacy Considerations:**

- Bug submission respects user consent - reports are only sent if user has opted in
- Avoid including sensitive user data in context
- Follow the same privacy levels as automatic error reporting

#### Integration Patterns

**Hook-Based Registration:**

```javascript
Hooks.on('errorsAndEchoesReady', api => {
  // API is ready for bug submissions
  window.MyModule.submitBug = bugData => api.submitBug(bugData);
});
```

**Conditional Availability:**

```javascript
function trySubmitBug(bugReport) {
  const errorReporter = game.modules.get('errors-and-echoes');

  if (!errorReporter?.active) {
    console.warn('Errors and Echoes not available - bug report not submitted');
    return false;
  }

  if (!errorReporter.api?.hasConsent()) {
    ui.notifications.warn(
      'Error reporting disabled - enable in Errors and Echoes settings to submit bug reports'
    );
    return false;
  }

  errorReporter.api.submitBug(bugReport);
  return true;
}
```

## Consent Management

### `api.hasConsent(): boolean`

Check if the user has consented to error reporting.

```javascript
const errorReporter = game.modules.get('errors-and-echoes');
if (errorReporter?.active && errorReporter.api?.hasConsent()) {
  console.log('Error reporting is enabled');
  // Safe to report errors
} else {
  console.log('Error reporting is disabled or not available');
  // Handle gracefully - don't report errors
}
```

### `api.getPrivacyLevel(): string`

Get the current privacy level setting.

**Return Values:**

- `'minimal'` - Basic error info only
- `'standard'` - Error info + system context
- `'detailed'` - Full debugging context

```javascript
const privacyLevel = errorReporter.api.getPrivacyLevel();
console.log(`Current privacy level: ${privacyLevel}`);

// Adjust your context provider based on privacy level
if (privacyLevel === 'detailed') {
  // Include extra debugging information
  context.detailedCanvasState = getDetailedCanvasState();
}
```

### `api.getStats(): ReportStats`

Get error reporting statistics for debugging and transparency.

```typescript
interface ReportStats {
  totalReports: number; // Total reports sent since module load
  recentReports: number; // Reports sent in the last hour
  lastReportTime?: string; // ISO timestamp of last report
}
```

```javascript
const stats = errorReporter.api.getStats();
console.log(`Statistics: ${stats.totalReports} total, ${stats.recentReports} recent`);

if (stats.lastReportTime) {
  const lastReport = new Date(stats.lastReportTime);
  console.log(`Last report: ${lastReport.toLocaleString()}`);
}
```

## TypeScript Interfaces

### Complete Interface Definitions

```typescript
// Main API Interface
interface ErrorsAndEchoesAPI {
  register(config: ModuleRegistrationConfig): void;
  report(error: Error, options?: ReportOptions): void;
  submitBug(bugReport: BugReportSubmission): void;
  hasConsent(): boolean;
  getPrivacyLevel(): PrivacyLevel;
  getStats(): ReportStats;
}

// Registration Configuration
interface ModuleRegistrationConfig {
  moduleId: string;
  contextProvider?: () => Record<string, any>;
  errorFilter?: (error: Error) => boolean;
  endpoint?: EndpointConfig;
}

// Manual Reporting Options
interface ReportOptions {
  module?: string;
  context?: Record<string, any>;
}

// Manual Bug Submission
interface BugReportSubmission {
  title: string; // Brief title/summary (required)
  description: string; // User description of the bug (required)
  stepsToReproduce?: string; // Optional steps to reproduce
  expectedBehavior?: string; // What should happen
  actualBehavior?: string; // What actually happens
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'functionality' | 'performance' | 'integration' | 'other';
  module?: string; // Override module detection
  context?: Record<string, any>; // Additional context
}

// Endpoint Configuration
interface EndpointConfig {
  name: string; // Human-readable endpoint name
  url: string; // HTTPS URL for error reports
  author?: string; // GitHub username or author identifier
  modules?: string[]; // Array of module IDs this endpoint handles
  enabled: boolean; // Whether this endpoint is active
}

// Privacy Levels
type PrivacyLevel = 'minimal' | 'standard' | 'detailed';

// Reporting Statistics
interface ReportStats {
  totalReports: number;
  recentReports: number;
  lastReportTime?: string;
}

// Error Attribution (Internal)
interface Attribution {
  moduleId: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  method: 'stack-trace' | 'hook-context' | 'pattern-match' | 'unknown';
  source: string;
}

// Report Payload (Sent to Endpoints)
interface ReportPayload {
  error: {
    message: string;
    stack?: string;
    type: string;
    source: string;
  };
  attribution: Attribution;
  foundry: {
    version: string;
    system?: {
      id: string;
      version: string;
    };
    modules?: Array<{
      id: string;
      version: string;
    }>;
    scene?: string;
  };
  client?: {
    sessionId: string;
    browser?: string;
  };
  meta: {
    timestamp: string;
    privacyLevel: PrivacyLevel;
    reporterVersion: string;
  };
  moduleContext?: Record<string, any>;
}

// Endpoint Response Format
interface ErrorReportResponse {
  success: boolean;
  eventId?: string;
  message?: string;
  timestamp?: string;
  endpoint?: string;
  retryAfter?: number;
}
```

## Testing and Debugging

### Global Debugging Interface

The module exposes debugging utilities on `window.ErrorsAndEchoes`:

```javascript
// Access debugging tools
const debug = window.ErrorsAndEchoes;

// Test error attribution
const attribution = debug.ErrorAttribution.attributeToModule(new Error('Test error'), {
  source: 'javascript',
  timestamp: Date.now(),
});
console.log('Attribution result:', attribution);

// Test endpoint connectivity
const success = await debug.ErrorReporter.testEndpoint(
  'https://errors.my-domain.com/report/my-module'
);
console.log('Endpoint test:', success ? 'PASSED' : 'FAILED');

// Show welcome dialog (testing)
debug.showWelcomeDialog();

// Access internal classes for advanced debugging
const { ErrorCapture, ErrorAttribution, ErrorReporter, ConsentManager } = debug;
```

### Testing Error Attribution

```javascript
// Test with your module's typical errors
function testMyModuleAttribution() {
  const testErrors = [
    new Error('MyModule: Configuration validation failed'),
    new Error('Cannot read property "name" of undefined'),
    new Error('Failed to update document'),
  ];

  testErrors.forEach(error => {
    // Simulate error with stack trace from your module
    error.stack = `Error: ${error.message}
    at MyModule.init (modules/my-module/scripts/module.js:42:15)
    at Hook.call (foundry.js:1234:22)
    at Hooks.callAll (foundry.js:1267:18)`;

    const attribution = window.ErrorsAndEchoes.ErrorAttribution.attributeToModule(error, {
      source: 'javascript',
      timestamp: Date.now(),
    });

    console.log(`Error: "${error.message}"`);
    console.log(`Attributed to: ${attribution.moduleId} (confidence: ${attribution.confidence})`);
    console.log('---');
  });
}
```

### Testing Context Providers

```javascript
// Test your context provider function
function testContextProvider() {
  const errorReporter = game.modules.get('errors-and-echoes');
  if (!errorReporter?.active) return;

  // Register with test context provider
  errorReporter.api.register({
    moduleId: 'test-module',
    contextProvider: () => {
      console.log('Context provider called');

      const context = {
        timestamp: Date.now(),
        scene: canvas.scene?.name,
        userRole: game.user.role,
      };

      console.log('Generated context:', context);
      return context;
    },
  });

  // Trigger a test error
  setTimeout(() => {
    try {
      throw new Error('Test error for context provider');
    } catch (error) {
      errorReporter.api.report(error, {
        module: 'test-module',
        context: { test: true },
      });
    }
  }, 1000);
}
```

## Error Handling

### API Resilience

All API methods are designed to fail gracefully:

```javascript
// Safe API usage pattern
function safelyReportError(error, context = {}) {
  try {
    const errorReporter = game.modules.get('errors-and-echoes');

    // Check if module is available and active
    if (!errorReporter?.active) return;

    // Check if API is available
    if (!errorReporter.api) return;

    // Check if user has consented
    if (!errorReporter.api.hasConsent()) return;

    // Report the error
    errorReporter.api.report(error, {
      module: 'my-module',
      context,
    });
  } catch (reportingError) {
    // NEVER let error reporting break your module
    console.warn('Failed to report error:', reportingError);
  }
}
```

### Handling Missing Dependencies

```javascript
// Graceful degradation when Errors and Echoes is not available
class MyModule {
  static reportError(error, context = {}) {
    const errorReporter = game.modules.get('errors-and-echoes');

    if (errorReporter?.active && errorReporter.api?.hasConsent()) {
      try {
        errorReporter.api.report(error, {
          module: 'my-module',
          context,
        });
      } catch (reportingError) {
        // Silent failure - don't spam console
      }
    }

    // Always handle the error normally
    console.error(`MyModule Error:`, error);
  }

  static async initialize() {
    try {
      await this.setupModule();

      // Register for error reporting if available
      const errorReporter = game.modules.get('errors-and-echoes');
      if (errorReporter?.active && errorReporter.api) {
        errorReporter.api.register({
          moduleId: 'my-module',
          contextProvider: () => this.getModuleContext(),
        });
      }
    } catch (error) {
      this.reportError(error, { phase: 'initialization' });
      throw error;
    }
  }
}
```

## Integration Examples

### Complete Module Integration

```javascript
// my-module/scripts/module.js

class MyAwesomeModule {
  static moduleId = 'my-awesome-module';
  static errorReporter = null;

  static async initialize() {
    try {
      console.log('MyAwesome | Initializing module');

      // Set up error reporting first
      this.setupErrorReporting();

      // Initialize module features
      await this.setupFeatures();

      console.log('MyAwesome | Module initialized successfully');
    } catch (error) {
      this.reportError(error, { phase: 'initialization' });
      throw error;
    }
  }

  static setupErrorReporting() {
    this.errorReporter = game.modules.get('errors-and-echoes');

    if (this.errorReporter?.active && this.errorReporter.api) {
      this.errorReporter.api.register({
        moduleId: this.moduleId,

        contextProvider: () => ({
          // Module state
          version: game.modules.get(this.moduleId)?.version,
          initialized: this.isInitialized,
          featureFlags: {
            advancedMode: game.settings.get(this.moduleId, 'advancedMode'),
            debugLogging: game.settings.get(this.moduleId, 'debugLogging'),
          },

          // Current game state (Foundry v13+ compatible)
          foundry: {
            ready: game.ready,
            canvasReady: canvas.ready,
            currentScene: canvas.scene?.id,
            activeLayer: canvas.activeLayer?.constructor.name,
          },

          // User context (no PII)
          user: {
            isGM: game.user.isGM,
            role: game.user.role,
            activeCharacter: game.user.character?.id,
          },
        }),

        errorFilter: error => {
          // Only report errors from our module
          if (error.stack && !error.stack.includes(`/modules/${this.moduleId}/`)) {
            return false;
          }

          // Filter out expected errors
          const ignoredMessages = [
            'User cancelled operation',
            'Permission denied',
            'Network request timeout',
          ];

          return !ignoredMessages.some(msg => error.message.includes(msg));
        },
      });

      console.log('MyAwesome | Error reporting configured');
    }
  }

  static reportError(error, context = {}) {
    if (this.errorReporter?.active && this.errorReporter.api?.hasConsent()) {
      try {
        this.errorReporter.api.report(error, {
          module: this.moduleId,
          context: {
            ...context,
            timestamp: Date.now(),
            moduleVersion: game.modules.get(this.moduleId)?.version,
          },
        });
      } catch (reportingError) {
        // Silent failure to avoid error loops
      }
    }

    // Always log the error locally
    console.error(`MyAwesome | Error in ${context.phase || 'unknown'}:`, error);
  }

  static async performAsyncOperation(data) {
    try {
      console.log('MyAwesome | Starting async operation');

      // Simulate async work that might fail
      const result = await this.riskyAsyncWork(data);

      return result;
    } catch (error) {
      this.reportError(error, {
        phase: 'async-operation',
        operation: 'performAsyncOperation',
        dataType: typeof data,
        timestamp: Date.now(),
      });

      // Re-throw so calling code can handle it
      throw error;
    }
  }
}

// Hook registration (Foundry v13+ style)
Hooks.once('init', () => MyAwesomeModule.initialize());

// Error boundary for hook errors
Hooks.on('ready', () => {
  try {
    MyAwesomeModule.onReady();
  } catch (error) {
    MyAwesomeModule.reportError(error, { phase: 'ready-hook' });
    throw error;
  }
});
```

### Advanced Error Boundary Class

```javascript
// Advanced error boundary with automatic reporting
class ErrorBoundary {
  constructor(moduleId, errorReporter) {
    this.moduleId = moduleId;
    this.errorReporter = errorReporter;
  }

  // Wrap async functions with error reporting
  async wrapAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.reportError(error, { ...context, type: 'async' });
      throw error;
    }
  }

  // Wrap sync functions with error reporting
  wrapSync(fn, context = {}) {
    try {
      return fn();
    } catch (error) {
      this.reportError(error, { ...context, type: 'sync' });
      throw error;
    }
  }

  // Wrap hook callbacks
  wrapHook(hookName, fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.reportError(error, {
          type: 'hook',
          hookName,
          argCount: args.length,
        });
        throw error;
      }
    };
  }

  reportError(error, context = {}) {
    if (this.errorReporter?.active && this.errorReporter.api?.hasConsent()) {
      try {
        this.errorReporter.api.report(error, {
          module: this.moduleId,
          context: {
            ...context,
            timestamp: Date.now(),
            boundaryId: this.constructor.name,
          },
        });
      } catch (reportingError) {
        // Silent failure
      }
    }
  }
}

// Usage:
const boundary = new ErrorBoundary('my-module', game.modules.get('errors-and-echoes'));

// Wrap risky operations
Hooks.on(
  'updateToken',
  boundary.wrapHook('updateToken', (tokenDocument, change, options, userId) => {
    // Your hook logic here
    console.log('Token updated:', tokenDocument.name);
  })
);

// Wrap async operations
async function updateTokenSafely(tokenId, updates) {
  return boundary.wrapAsync(
    async () => {
      const token = game.scenes.current.tokens.get(tokenId);
      return token.update(updates);
    },
    { operation: 'updateTokenSafely', tokenId }
  );
}
```

This API reference provides comprehensive documentation for integrating with Errors and Echoes in FoundryVTT v13+ environments, with emphasis on privacy-first design and graceful error handling.
