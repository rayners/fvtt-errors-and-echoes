# Technical Architecture - Errors and Echoes

Comprehensive technical documentation of the Errors and Echoes error reporting system architecture.

**Target Platform**: FoundryVTT v13+ (minimum v12.0.0)

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Flow Architecture](#data-flow-architecture)
3. [Component Architecture](#component-architecture)
4. [Error Attribution System](#error-attribution-system)
5. [Privacy and Consent Architecture](#privacy-and-consent-architecture)
6. [Network Communication](#network-communication)
7. [Performance Considerations](#performance-considerations)
8. [Security Architecture](#security-architecture)
9. [Extension Points](#extension-points)
10. [Technical Implementation Details](#technical-implementation-details)

## System Overview

Errors and Echoes is a client-side error reporting system that operates entirely within the Foundry VTT browser environment. The system is designed with privacy-first principles and never interferes with normal error propagation.

### Core Design Principles

1. **Never Swallow Errors**: All errors remain visible to users in console and dev tools
2. **Privacy First**: Opt-in only with granular privacy controls
3. **Non-Intrusive**: Zero impact on game performance or user experience
4. **Graceful Degradation**: System works even if error reporting fails
5. **GM-Only Control**: Only GMs can enable error reporting for their world

### System Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    Foundry VTT Browser Environment              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Errors and Echoes Module                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Error       │ │ Error       │ │ Error Reporting     │  │  │
│  │  │ Capture     │ │ Attribution │ │ & Network Layer     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Consent     │ │ Settings    │ │ Public API          │  │  │
│  │  │ Manager     │ │ UI          │ │ Interface           │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   External Error    │
                    │   Reporting         │
                    │   Endpoints         │
                    └─────────────────────┘
```

## Data Flow Architecture

### High-Level Data Flow

```
JavaScript Error → Error Capture → Attribution → Consent Check → Privacy Filter → Network Report
      │                │              │             │              │               │
      ▼                ▼              ▼             ▼              ▼               ▼
   Always         Detect Source    Identify     Check User      Apply Privacy   Send to
   Visible to        Module       Responsible   Permissions     Level Filter    Endpoint
   User                            Module
```

### Detailed Data Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JavaScript    │    │   Promise       │    │   Console       │
│   Errors        │    │   Rejections    │    │   Errors        │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Error Capture Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Window      │ │ Promise     │ │ Console/Hook            │   │
│  │ Listeners   │ │ Listeners   │ │ Patching                │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Error Attribution Engine                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Stack Trace │ │ Hook        │ │ Pattern Matching        │   │
│  │ Analysis    │ │ Context     │ │ & Active Detection      │   │
│  │ (High Conf) │ │ (Med Conf)  │ │ (Low/Med Confidence)    │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Consent Manager                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Global      │ │ Endpoint    │ │ Privacy Level           │   │
│  │ Consent     │ │ Consent     │ │ Configuration           │   │
│  │ Check       │ │ Check       │ │ Validation              │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Privacy Filter                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Minimal     │ │ Standard    │ │ Detailed                │   │
│  │ Data Only   │ │ + System    │ │ + Browser & Scene       │   │
│  │             │ │ Context     │ │ Context                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Error Reporter                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Rate        │ │ Duplication │ │ Network Transmission    │   │
│  │ Limiting    │ │ Prevention  │ │ & Response Handling     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
              ┌─────────────────┐
              │   External      │
              │   Endpoint      │
              │   (Sentry,      │
              │   Discord,      │
              │   Custom)       │
              └─────────────────┘
```

## Component Architecture

### Core Components

#### 1. ErrorCapture Class

**Responsibility**: Global error detection and capture
**Type**: Singleton service class
**Dependencies**: None (foundational component)

```typescript
class ErrorCapture {
  // Global error listeners (never preventDefault())
  - handleWindowError(event: ErrorEvent): void
  - handleUnhandledRejection(event: PromiseRejectionEvent): void

  // Console patching (preserves original behavior)
  - patchConsoleError(): void
  - patchConsoleWarn(): void

  // Foundry hook patching (non-interfering)
  - patchFoundryHooks(): void

  // State management
  - startListening(): void
  - stopListening(): void
  - getIsListening(): boolean
}
```

**Design Patterns Used**:

- **Singleton**: Single global error capture instance
- **Decorator**: Patches existing functions while preserving behavior
- **Observer**: Listens to global error events

#### 2. ErrorAttribution Class

**Responsibility**: Determine which module caused an error
**Type**: Utility class with static methods
**Dependencies**: Author utilities, module pattern definitions

```typescript
class ErrorAttribution {
  // Attribution methods (in priority order)
  - attributeToModule(error: Error, context: ErrorContext): Attribution
  - attributeFromStackTrace(stack: string): Attribution | null
  - attributeFromHookContext(hookName: string): Attribution | null
  - attributeFromPatternMatching(error: Error): Attribution | null
  - attributeFromActiveModule(): Attribution | null

  // Confidence calculation
  - calculateConfidenceScore(attribution: Attribution): number
  - getDetailedAttribution(error: Error): DetailedAttribution
}
```

**Attribution Algorithm**:

```
1. Stack Trace Analysis (Confidence: High 0.8)
   ├─ Parse stack for /modules/{module-id}/ patterns
   ├─ Support multiple path formats (Unix/Windows)
   └─ Extract file/line information

2. Hook Context Detection (Confidence: Medium 0.6)
   ├─ Check if error occurred during hook execution
   ├─ Generate stack trace to find calling module
   └─ Associate with hook-specific patterns

3. Pattern Matching (Confidence: Low 0.4)
   ├─ Match error content against known module signatures
   ├─ Search both stack trace and error message
   └─ Use configurable pattern library

4. Active Module Detection (Confidence: Medium 0.6)
   ├─ Analyze current call stack
   └─ Identify currently executing module
```

#### 3. ConsentManager Class

**Responsibility**: Privacy and consent management
**Type**: Singleton service class
**Dependencies**: Foundry settings system

```typescript
class ConsentManager {
  // Consent status
  - hasConsent(): boolean
  - isConsentValid(): boolean
  - shouldShowWelcome(): boolean

  // Consent management
  - setConsent(enabled: boolean, privacyLevel?: PrivacyLevel): Promise<void>
  - revokeConsent(): Promise<void>

  // Endpoint-specific consent
  - hasEndpointConsent(endpointUrl: string): boolean
  - setEndpointConsent(endpointUrl: string, enabled: boolean): Promise<void>

  // Privacy settings
  - getPrivacyLevel(): PrivacyLevel
  - getConsentDate(): string | null
}
```

**Privacy Level Data Collection**:

| Level        | Error Data                              | System Data                                                 | Context Data                                             | Browser Data            |
| ------------ | --------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- | ----------------------- |
| **Minimal**  | ✅ Message<br>✅ Stack trace<br>✅ Type | ✅ Foundry version                                          | ✅ Module attribution<br>✅ Timestamp                    | ❌                      |
| **Standard** | ✅ All minimal data                     | ✅ All minimal<br>✅ System ID/version<br>✅ Active modules | ✅ All minimal<br>✅ Session ID (anonymous)              | ❌                      |
| **Detailed** | ✅ All standard data                    | ✅ All standard data                                        | ✅ All standard<br>✅ Current scene<br>✅ Module context | ✅ Browser name/version |

#### 4. ErrorReporter Class

**Responsibility**: Network communication and rate limiting
**Type**: Singleton service class
**Dependencies**: ConsentManager, EndpointConfig

```typescript
class ErrorReporter {
  // Reporting pipeline
  - sendReport(error: Error, attribution: Attribution, endpoint: EndpointConfig, context: object): Promise<void>
  - buildPayload(error: Error, attribution: Attribution, privacyLevel: PrivacyLevel, context: object): ReportPayload

  // Rate limiting and deduplication
  - shouldSendReport(error: Error, attribution: Attribution): boolean
  - recordSuccessfulReport(moduleId: string, error: Error, eventId?: string): void
  - cleanupOldReports(): void

  // Utilities
  - testEndpoint(url: string): Promise<boolean>
  - getReportStats(): ReportStats
  - clearStats(): void
}
```

**Rate Limiting Strategy**:

- **Deduplication Window**: 1 minute for identical errors
- **Hourly Rate Limit**: Maximum 50 reports per hour
- **Error Signature**: Based on `moduleId:message:stackSignature`
- **Cleanup**: Automatic cleanup of old rate limiting entries

### UI Components

#### 5. ErrorReporterWelcomeDialog

**Responsibility**: Initial consent and configuration
**Type**: Foundry Application class
**Dependencies**: ConsentManager, Settings UI

```typescript
class ErrorReporterWelcomeDialog extends Application {
  // Dialog lifecycle
  - show(): Promise<void>
  - render(): string
  - activateListeners(html: JQuery): void

  // User interactions
  - handleConsentChoice(enabled: boolean, privacyLevel: PrivacyLevel): Promise<void>
  - handlePrivacyDetailsRequest(): void
  - handleSettingsConfiguration(): void
}
```

#### 6. EndpointConfigDialog

**Responsibility**: Advanced endpoint configuration
**Type**: Foundry FormApplication class
**Dependencies**: Settings system, endpoint validation

## Error Attribution System

### Attribution Methods

#### 1. Stack Trace Analysis (Primary Method)

**Confidence Level**: High (0.8 base score)
**Method**: Parse JavaScript stack traces for module path patterns

```typescript
// Pattern matching for module paths
const modulePathPatterns = [
  /\/modules\/([^\/]+)\//, // Unix: /modules/module-id/
  /\\modules\\([^\\]+)\\/, // Windows: \modules\module-id\
  /modules%2F([^%]+)%2F/, // URL encoded: modules%2Fmodule-id%2F
];

// Attribution process
function attributeFromStackTrace(stack: string): Attribution | null {
  for (const pattern of modulePathPatterns) {
    const match = stack.match(pattern);
    if (match) {
      return {
        moduleId: match[1],
        confidence: 'high',
        method: 'stack-trace',
        source: 'javascript',
      };
    }
  }
  return null;
}
```

#### 2. Hook Context Detection (Secondary Method)

**Confidence Level**: Medium (0.6 base score)
**Method**: Detect errors during Foundry hook execution

```typescript
// Hook patching strategy
Hooks.call = function (hook: string, ...args: any[]): boolean {
  try {
    return originalHooksCall.call(Hooks, hook, ...args);
  } catch (error) {
    // Generate new stack trace to find calling module
    const contextStack = new Error().stack;
    const attribution = attributeFromStackTrace(contextStack);

    if (attribution) {
      attribution.method = 'hook-context';
      attribution.confidence = 'medium';
      attribution.source = `hook:${hook}`;
    }

    handleError(error, { ...context, hookName: hook });
    throw error; // Re-throw for normal error handling
  }
};
```

#### 3. Pattern Matching (Tertiary Method)

**Confidence Level**: Low (0.4 base score)
**Method**: Match error signatures against known module patterns

```typescript
// Module-specific error patterns
const modulePatterns: ModulePattern[] = [
  {
    pattern: /PartyActor|PartySheet|PartyModel/,
    module: 'journeys-and-jamborees',
  },
  {
    pattern: /RealmManager|BiomeLayer/,
    module: 'realms-and-reaches',
  },
  {
    pattern: /CalendarWidget|CalendarEngine/,
    module: 'seasons-and-stars',
  },
  {
    pattern: /ErrorCapture|ErrorReporter|ConsentManager/,
    module: 'errors-and-echoes',
  },
];

function attributeFromPatternMatching(error: Error): Attribution | null {
  const searchText = `${error.message} ${error.stack}`;

  for (const { pattern, module } of modulePatterns) {
    if (pattern.test(searchText)) {
      return {
        moduleId: module,
        confidence: 'low',
        method: 'pattern-match',
        source: 'signature',
      };
    }
  }
  return null;
}
```

#### 4. Active Module Detection (Fallback Method)

**Confidence Level**: Medium (0.6 base score)
**Method**: Analyze call stack for currently executing modules

### Confidence Scoring Algorithm

```typescript
function calculateConfidenceScore(attribution: Attribution): number {
  const baseScores = {
    'stack-trace': 0.8,
    'hook-context': 0.6,
    'pattern-match': 0.4,
    unknown: 0.2,
  };

  const sourceBonus = {
    javascript: 0.1,
    promise: 0.1,
    hook: 0.05,
    console: 0.05,
  };

  let score = baseScores[attribution.method] || 0.0;
  score += sourceBonus[attribution.source] || 0.0;

  return Math.min(score, 1.0);
}
```

## Privacy and Consent Architecture

### Consent Management Flow

```
User First Visit → Welcome Dialog → Privacy Explanation → Consent Decision
                                           │
                                           ▼
                               ┌─────────────────┐
                               │   User Choice   │
                               └─────────┬───────┘
                                         │
                        ┌────────────────┼────────────────┐
                        ▼                ▼                ▼
                   ┌──────────┐   ┌──────────┐   ┌──────────┐
                   │ Decline  │   │ Minimal  │   │ Standard │
                   │          │   │ Privacy  │   │ Privacy  │
                   └──────────┘   └──────────┘   └──────────┘
                        │                │                │
                        ▼                ▼                ▼
                   No Reporting     Basic Error      Full Context
                                    Info Only         Reporting
```

### Privacy Level Implementation

```typescript
function buildPayload(
  error: Error,
  attribution: Attribution,
  privacyLevel: PrivacyLevel,
  moduleContext: Record<string, any>
): ReportPayload {
  // Always included regardless of privacy level
  const basePayload: ReportPayload = {
    error: {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      source: attribution.source,
    },
    attribution,
    foundry: {
      version: game.version,
    },
    meta: {
      timestamp: new Date().toISOString(),
      privacyLevel,
      reporterVersion: getModuleVersion(),
    },
  };

  // Standard level additions
  if (privacyLevel === 'standard' || privacyLevel === 'detailed') {
    basePayload.foundry.system = {
      id: game.system.id,
      version: game.system.version,
    };

    basePayload.foundry.modules = game.modules.contents
      .filter(m => m.active)
      .map(m => ({ id: m.id, version: m.version }));

    basePayload.client = {
      sessionId: getAnonymousSessionId(), // Daily rotating, no PII
    };
  }

  // Detailed level additions
  if (privacyLevel === 'detailed') {
    if (basePayload.client) {
      basePayload.client.browser = getBrowserInfo(); // Just "Chrome/91"
    }

    if (canvas.scene) {
      basePayload.foundry.scene = canvas.scene.name;
    }
  }

  // Module context (all levels if provided)
  if (moduleContext && Object.keys(moduleContext).length > 0) {
    basePayload.moduleContext = moduleContext;
  }

  return basePayload;
}
```

### Anonymous Session Management

```typescript
function getAnonymousSessionId(): string {
  const today = new Date().toDateString();
  const storageKey = 'errors-and-echoes-session';

  try {
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const [date, id] = stored.split('|');
      if (date === today) {
        return id; // Reuse today's session ID
      }
    }

    // Generate new session ID for today
    const newId = 'anon-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(storageKey, `${today}|${newId}`);
    return newId;
  } catch (error) {
    // Fallback if localStorage unavailable
    return 'anon-' + Math.random().toString(36).substring(2, 15);
  }
}
```

## Network Communication

### Request/Response Flow

```
Module → ErrorReporter → Rate Limiting → Privacy Filter → HTTP Request → Endpoint
   │                                                                          │
   └─── Error Context ──────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            Standard Response
                               Format
```

### Standard Request Format

```typescript
interface ReportPayload {
  error: {
    message: string; // Error message
    stack?: string; // Stack trace (if available)
    type: string; // Error constructor name
    source: string; // Attribution source
  };
  attribution: {
    moduleId: string; // Attributed module ID
    confidence: string; // Confidence level
    method: string; // Attribution method
    source: string; // Error source type
  };
  foundry: {
    version: string; // Foundry VTT version
    system?: {
      // Game system (standard+)
      id: string;
      version: string;
    };
    modules?: Array<{
      // Active modules (standard+)
      id: string;
      version: string;
    }>;
    scene?: string; // Current scene (detailed only)
  };
  client?: {
    // Client info (standard+)
    sessionId: string; // Anonymous session ID
    browser?: string; // Browser info (detailed only)
  };
  meta: {
    timestamp: string; // ISO timestamp
    privacyLevel: string; // Privacy level used
    reporterVersion: string; // Module version
  };
  moduleContext?: Record<string, any>; // Module-provided context
}
```

### Standard Response Format

```typescript
interface ErrorReportResponse {
  success: boolean; // Whether the report was processed
  eventId?: string; // Unique identifier for this report
  message?: string; // Human-readable status message
  timestamp?: string; // When the report was processed
  endpoint?: string; // Endpoint that processed it
  retryAfter?: number; // Seconds to wait before retry (rate limiting)
}
```

### Network Error Handling

```typescript
async function sendReport(
  error: Error,
  attribution: Attribution,
  endpoint: EndpointConfig,
  moduleContext: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Foundry-Version': game.version,
        'X-Module-Version': getModuleVersion(),
        'X-Privacy-Level': getPrivacyLevel(),
        'User-Agent': getUserAgent(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reportResponse: ErrorReportResponse = await response.json();

    if (reportResponse.success) {
      recordSuccessfulReport(attribution.moduleId, error, reportResponse.eventId);
    } else {
      throw new Error(reportResponse.message || 'Report processing failed');
    }
  } catch (networkError) {
    console.warn('Errors and Echoes: Failed to send error report:', networkError);
    // CRITICAL: Never re-throw - don't let reporting errors affect the game
  }
}
```

## Performance Considerations

### Memory Management

1. **Rate Limiting Cache**: Automatic cleanup of old entries
2. **Error Context**: Minimal object retention
3. **Event Listeners**: Proper cleanup on module disable
4. **Stack Trace Processing**: Lazy parsing and limited retention

### CPU Impact

1. **Attribution Analysis**: Cached pattern compilation
2. **Privacy Filtering**: Minimal object transformation
3. **Network Requests**: Async with no blocking
4. **Error Capture**: Zero-overhead event listening

### Performance Metrics

```typescript
class PerformanceTracker {
  private static metrics = {
    attributionTime: 0,
    reportingTime: 0,
    totalProcessed: 0,
  };

  static measureAttribution<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    this.metrics.attributionTime += performance.now() - start;
    return result;
  }

  static getMetrics() {
    return {
      ...this.metrics,
      avgAttributionTime: this.metrics.attributionTime / this.metrics.totalProcessed,
      avgReportingTime: this.metrics.reportingTime / this.metrics.totalProcessed,
    };
  }
}
```

## Security Architecture

### Input Validation

```typescript
function validateErrorReport(payload: any): payload is ReportPayload {
  return !!(
    payload &&
    typeof payload === 'object' &&
    payload.error?.message &&
    typeof payload.error.message === 'string' &&
    payload.attribution?.moduleId &&
    typeof payload.attribution.moduleId === 'string' &&
    payload.meta?.timestamp &&
    typeof payload.meta.timestamp === 'string' &&
    ['minimal', 'standard', 'detailed'].includes(payload.meta.privacyLevel)
  );
}
```

### Data Sanitization

```typescript
function sanitizeErrorData(error: Error): Error {
  const sanitized = new Error(error.message);

  if (error.stack) {
    // Remove potential file paths containing usernames
    sanitized.stack = error.stack
      .replace(/\/Users\/[^\/\s]+/g, '/Users/***')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\***')
      .replace(/\/home\/[^\/\s]+/g, '/home/***');
  }

  return sanitized;
}
```

### Endpoint Security

1. **HTTPS Only**: All endpoints must use HTTPS
2. **CORS Headers**: Proper CORS configuration
3. **Rate Limiting**: Built-in request rate limiting
4. **Input Validation**: Comprehensive payload validation

## Extension Points

### 1. Custom Attribution Patterns

```typescript
// Add new module patterns
const customPatterns: ModulePattern[] = [
  {
    pattern: /MyCustomModule|MyFeature/,
    module: 'my-custom-module',
  },
];

// Register during initialization
ErrorAttribution.addModulePatterns(customPatterns);
```

### 2. Custom Context Providers

```typescript
// Register enhanced context provider
errorReporter.api.register({
  moduleId: 'my-module',
  contextProvider: () => ({
    // Standard context
    moduleVersion: game.modules.get('my-module')?.version,

    // Custom context
    featureState: MyModule.getFeatureState(),
    userSettings: MyModule.getUserSettings(),
    performanceMetrics: MyModule.getPerformanceMetrics(),
  }),
});
```

### 3. Custom Error Filtering

```typescript
// Module-specific error filtering
const errorFilter = (error: Error): boolean => {
  // Filter out expected errors
  if (error.message.includes('User cancelled')) return false;
  if (error.message.includes('Permission denied')) return false;

  // Only report errors from our modules
  const moduleIds = ['my-module-1', 'my-module-2'];
  const stack = error.stack || '';
  return moduleIds.some(id => stack.includes(`/modules/${id}/`));
};
```

### 4. Custom Endpoints

```typescript
// Register custom endpoint
errorReporter.api.register({
  moduleId: 'my-module',
  endpoint: {
    name: 'My Custom Error Handler',
    url: 'https://errors.mydomain.com/report/mymodules',
    author: 'my-username',
    modules: ['my-module-1', 'my-module-2'],
    enabled: true,
  },
});
```

## Technical Implementation Details

### Module Initialization Sequence

```
1. Hooks.once('init') - Register settings and setup API
   │
   ├─ Register Foundry settings (privacy, endpoints, consent)
   ├─ Setup public API interface
   └─ Initialize ConsentManager

2. Hooks.once('ready') - Start error capture if consented
   │
   ├─ Check ConsentManager.hasConsent()
   ├─ Start ErrorCapture.startListening() if consented
   ├─ Show welcome dialog if needed (GM only)
   └─ Log initialization status
```

### Settings Architecture

```typescript
// Client-side settings stored in browser local storage
const settings = {
  globalEnabled: {
    scope: 'client',
    type: Boolean,
    default: false,
    onChange: handleGlobalToggle,
  },
  privacyLevel: {
    scope: 'client',
    type: String,
    choices: ['minimal', 'standard', 'detailed'],
    default: 'standard',
  },
  endpoints: {
    scope: 'client',
    type: Object,
    config: false, // Uses custom UI
    default: defaultEndpoints,
  },
  hasShownWelcome: {
    scope: 'client',
    config: false,
    type: Boolean,
    default: false,
  },
  consentDate: {
    scope: 'client',
    config: false,
    type: String,
    default: null,
  },
  endpointConsent: {
    scope: 'client',
    config: false,
    type: Object,
    default: {},
  },
};
```

### Error Propagation Guarantee

```typescript
// CRITICAL: Errors are NEVER swallowed
window.addEventListener('error', (event: ErrorEvent) => {
  try {
    // Our error reporting logic here
    handleError(event.error, context);
  } catch (reportingError) {
    // If our error reporting fails, log but don't throw
    console.warn('Error reporting failed:', reportingError);
  }

  // CRITICAL: We NEVER call event.preventDefault()
  // The error continues normal propagation to:
  // - Browser console
  // - Developer tools
  // - Other error handlers
  // - User visibility
});
```

### API Versioning Strategy

```typescript
// Version compatibility matrix
const API_VERSIONS = {
  '1.0': {
    minFoundryVersion: '12.0.0',
    maxFoundryVersion: '13.999.999',
    features: ['basic-reporting', 'privacy-levels', 'attribution'],
  },
};

// Backward compatibility guarantee
interface LegacySupport {
  supportedVersions: string[];
  migrationPaths: Record<string, string>;
  deprecationWarnings: Record<string, string>;
}
```

This technical architecture provides a comprehensive foundation for understanding, extending, and maintaining the Errors and Echoes system while ensuring privacy, performance, and reliability.
