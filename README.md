# Errors and Echoes

Anonymous error reporting for Foundry VTT modules to help authors improve their modules.

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| 🔍 Error Capture | ✅ Complete | Captures JavaScript errors, promise rejections, console errors, and hook errors |
| 🏷️ Module Attribution | ✅ Complete | Advanced stack trace analysis and hook context detection |
| 🔒 Privacy Controls | ✅ Complete | Three privacy levels with granular consent management |
| ⚙️ Settings UI | ✅ Complete | Foundry-native configuration interface |
| 📊 Manual Reporting | ✅ Complete | Direct error reporting API for modules |
| 🔗 **Module Registration API** | ⚠️ **Stub Only** | **Core registration system unimplemented** |
| 🧪 Testing Infrastructure | ⚠️ **Missing** | **No automated tests implemented** |

## Overview

Errors and Echoes is a privacy-focused error reporting system for Foundry VTT that helps module developers identify and fix issues in their modules. The system captures JavaScript errors, promise rejections, console errors, and Foundry hook errors, then reports them to configured endpoints with sophisticated module attribution and privacy controls.

**🔒 Privacy First**: All error reporting is opt-in only with granular privacy controls. The module never swallows errors - all errors remain visible to users in the console and dev tools.

## Key Features

- **Anonymous Error Reporting**: No personally identifiable information is collected
- **Sophisticated Module Attribution**: Advanced stack trace analysis to identify which module caused an error
- **Granular Privacy Controls**: Three privacy levels from minimal to detailed data collection
- **Rate Limiting & Deduplication**: Prevents spam and respects user bandwidth
- **Foundry-Native Integration**: Built on Foundry's settings system with proper GM-only controls
- **Never Swallows Errors**: All errors remain visible to users - reporting happens in addition to normal error display

## Quick Start for Module Developers

### Manual Error Reporting (Available Now)

Report specific errors from your module:

```javascript
// Report errors manually when they occur
try {
  // Your code that might error
  riskyOperation();
} catch (error) {
  // Report to error monitoring
  const errorReporter = game.modules.get('errors-and-echoes');
  if (errorReporter?.active && errorReporter.api) {
    errorReporter.api.report(error, {
      module: 'your-module-id',
      context: {
        operation: 'riskyOperation',
        userAction: 'button-click'
      }
    });
  }
  
  // Still handle the error normally
  console.error('Operation failed:', error);
  ui.notifications.error('Operation failed. Please try again.');
}
```

### Module Registration (Coming Soon)

⚠️ **Note**: The full registration API is not yet implemented. Module registration will be available in a future release.

## API Documentation

### ErrorsAndEchoesAPI Interface

The main API is exposed via `game.modules.get('errors-and-echoes').api`:

```typescript
interface ErrorsAndEchoesAPI {
  register: (config: ModuleRegistrationConfig) => void;
  report: (error: Error, options?: ReportOptions) => void;
  hasConsent: () => boolean;
  getPrivacyLevel: () => string;
  getStats: () => ReportStats;
}
```

### Module Registration

Register your module for enhanced error reporting:

```typescript
interface ModuleRegistrationConfig {
  moduleId: string;                                    // Your module's ID
  contextProvider?: () => Record<string, any>;         // Optional context provider function
  errorFilter?: (error: Error) => boolean;             // Optional error filter
  endpoint?: EndpointConfig;                           // Optional custom endpoint
}
```

#### Context Provider Function

Provide additional debugging context when errors occur:

```javascript
const contextProvider = () => ({
  // Version information
  moduleVersion: game.modules.get('my-module')?.version,
  foundryVersion: game.version,
  
  // Current state
  activeScene: canvas.scene?.name,
  selectedTokens: canvas.tokens?.controlled?.length || 0,
  
  // Module-specific state
  customSetting: game.settings.get('my-module', 'important-setting'),
  featureEnabled: MyModule.isFeatureEnabled(),
  
  // User context (be careful about privacy)
  isGM: game.user.isGM,
  // DON'T include: usernames, IP addresses, email addresses, etc.
});
```

#### Error Filter Function

Filter which errors to report:

```javascript
const errorFilter = (error) => {
  // Don't report errors we expect or can't fix
  if (error.message.includes('Network request failed')) return false;
  if (error.message.includes('Permission denied')) return false;
  
  // Only report errors from our module
  if (error.stack && !error.stack.includes('/modules/my-module/')) return false;
  
  return true;
};
```

### Manual Reporting

Report errors manually with additional context:

```typescript
interface ReportOptions {
  module?: string;                    // Override detected module
  context?: Record<string, any>;      // Additional context
}
```

### Consent and Privacy

Check user consent and privacy settings:

```javascript
const errorReporter = game.modules.get('errors-and-echoes');
if (errorReporter?.active && errorReporter.api) {
  // Check if user has consented to error reporting
  if (errorReporter.api.hasConsent()) {
    console.log('Error reporting enabled');
    console.log('Privacy level:', errorReporter.api.getPrivacyLevel());
  }
  
  // Get reporting statistics
  const stats = errorReporter.api.getStats();
  console.log(`${stats.totalReports} total reports, ${stats.recentReports} in last hour`);
}
```

## Privacy Levels

### Minimal
- **Error message and stack trace**
- **Module attribution**
- **Foundry version**
- **Timestamp**

### Standard (Default)
- Everything from Minimal, plus:
- **Active system and version**
- **List of active modules and versions**
- **Anonymous session ID (daily rotating)**

### Detailed
- Everything from Standard, plus:
- **Browser name and version** (e.g., "Chrome/91")
- **Current scene name**
- **Module-provided context**

## Architecture Overview

### Error Capture
The `ErrorCapture` class listens for errors using multiple methods:
- **Window error events** (`window.addEventListener('error', ...)`)
- **Unhandled promise rejections** (`window.addEventListener('unhandledrejection', ...)`)
- **Console error patching** (preserves original `console.error` behavior)
- **Foundry hook errors** (patches `Hooks.call` and `Hooks.callAll`)

**Critical Design Principle**: The module NEVER calls `preventDefault()` or swallows errors. All errors remain visible to users.

### Error Attribution
The `ErrorAttribution` class uses sophisticated analysis to determine which module caused an error:

1. **Stack Trace Analysis** (High Confidence): Parses stack traces for `/modules/[module-name]/` patterns
2. **Hook Context Detection** (Medium Confidence): Attributes errors during hook execution
3. **Pattern Matching** (Low Confidence): Uses predefined patterns for known module error signatures
4. **Active Module Detection** (Medium Confidence): Fallback using call stack analysis

### Error Reporting
The `ErrorReporter` class handles sending reports to configured endpoints:
- **Rate limiting**: Maximum 50 reports per hour
- **Deduplication**: Prevents duplicate reports within 1-minute windows
- **Privacy filtering**: Builds payloads based on user's privacy level
- **Endpoint routing**: Sends reports to appropriate author endpoints

### Consent Management
The `ConsentManager` class handles all privacy and consent decisions:
- **Opt-in only**: No data collection without explicit user consent
- **GM-only control**: Only GMs can enable error reporting for their world
- **Consent expiration**: Consent expires after 1 year and requires renewal
- **Per-endpoint consent**: Users can control which author endpoints receive reports

## Integration Patterns

### Error Boundaries
Wrap risky operations with error boundaries:

```javascript
class MyModuleFeature {
  async performComplexOperation() {
    try {
      const result = await this.riskyAsyncOperation();
      return result;
    } catch (error) {
      // Report error while preserving normal error handling
      this.reportError(error, { operation: 'performComplexOperation' });
      
      // Handle error normally
      throw error; // Re-throw if calling code should handle it
      // OR provide fallback behavior
    }
  }
  
  reportError(error, context = {}) {
    const errorReporter = game.modules.get('errors-and-echoes');
    if (errorReporter?.active && errorReporter.api?.hasConsent()) {
      errorReporter.api.report(error, {
        module: this.moduleId,
        context: {
          ...context,
          timestamp: Date.now(),
          userAction: this.currentUserAction
        }
      });
    }
  }
}
```

### Custom Endpoints
Module authors can configure custom endpoints:

```javascript
// During module registration
errorReporter.api.register({
  moduleId: 'my-module',
  endpoint: {
    name: 'My Module Error Reporting',
    url: 'https://errors.my-domain.com/report/my-module',
    author: 'my-username',
    modules: ['my-module', 'my-other-module'],
    enabled: true
  }
});
```

### Testing Error Reporting
Test your error reporting integration:

```javascript
// Test endpoint connectivity
const errorReporter = game.modules.get('errors-and-echoes');
if (errorReporter?.active) {
  const testUrl = 'https://errors.my-domain.com/report/my-module';
  const success = await ErrorReporter.testEndpoint(testUrl);
  console.log('Endpoint test:', success ? 'PASSED' : 'FAILED');
}

// Test error attribution
window.ErrorsAndEchoes.ErrorAttribution.attributeToModule(
  new Error('Test error'),
  { source: 'javascript', timestamp: Date.now() }
);

// Generate test error
try {
  throw new Error('Test error from my-module');
} catch (error) {
  errorReporter.api.report(error, {
    module: 'my-module',
    context: { test: true }
  });
}
```

## Error Endpoint Requirements

### Request Format
Endpoints should accept POST requests with this payload structure:

```typescript
interface ReportPayload {
  error: {
    message: string;
    stack?: string;
    type: string;
    source: string;
  };
  attribution: {
    moduleId: string;
    confidence: 'high' | 'medium' | 'low' | 'none';
    method: 'stack-trace' | 'hook-context' | 'pattern-match' | 'unknown';
    source: string;
  };
  foundry: {
    version: string;
    system?: { id: string; version: string; };
    modules?: Array<{ id: string; version: string; }>;
    scene?: string;
  };
  client?: {
    sessionId: string;
    browser?: string;
  };
  meta: {
    timestamp: string;
    privacyLevel: 'minimal' | 'standard' | 'detailed';
    reporterVersion: string;
  };
  moduleContext?: Record<string, any>;
}
```

### Response Format
Endpoints should respond with this format:

```typescript
interface ErrorReportResponse {
  success: boolean;
  eventId?: string;        // Unique identifier for the report
  message?: string;        // Human-readable status message
  timestamp?: string;      // ISO timestamp when processed
  endpoint?: string;       // Endpoint that processed the request
  retryAfter?: number;     // Seconds to wait before retrying (rate limiting)
}
```

### Endpoint Testing
Endpoints should support test requests at `/test/` instead of `/report/`:

```bash
POST /test/my-module
Content-Type: application/json

{
  "test": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "endpoint-test"
}
```

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- FoundryVTT development environment

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the module: `npm run build`
4. Link to Foundry modules directory
5. Enable in Foundry and configure endpoints

### Testing
```bash
# Run TypeScript compilation
npm run build

# Test endpoint connectivity (if configured)
# Use browser console in Foundry:
await ErrorReporter.testEndpoint('https://your-endpoint.com/report/test');
```

### Building
```bash
# Development build
npm run build

# Production build with minification
npm run build:prod
```

## Security Considerations

### Data Privacy
- **No PII**: Never collect usernames, email addresses, IP addresses, or other PII
- **Anonymous sessions**: Session IDs rotate daily and contain no identifying information
- **Minimal data**: Collect only what's necessary for debugging
- **User control**: Users can disable reporting or change privacy levels at any time

### Endpoint Security
- **HTTPS required**: All endpoints must use HTTPS
- **Rate limiting**: Implement server-side rate limiting
- **Validation**: Validate all incoming data
- **Authentication**: Consider API keys for private endpoints

### Module Security
- **Never swallow errors**: Always preserve original error behavior
- **Graceful degradation**: Module should work even if error reporting fails
- **No dependencies**: Core error reporting works without external dependencies

## Contributing

### Code Style
- TypeScript with strict mode enabled
- ESLint configuration provided
- Foundry VTT coding conventions

### Testing Requirements
- Test error attribution with your module's error patterns
- Verify endpoint integration works correctly
- Test privacy level filtering

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with clear description

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contact and Support

- **GitHub Issues**: [fvtt-errors-and-echoes/issues](https://github.com/rayners/fvtt-errors-and-echoes/issues)
- **Author**: David Raynes ([@rayners](https://github.com/rayners))
- **Discord**: rayners78

## Legal and Privacy

This module complies with GDPR and other privacy regulations. See:
- [Privacy Policy](PRIVACY-POLICY.md)
- [Legal Compliance](LEGAL-COMPLIANCE.md)
- [Security Policy](SECURITY.md)

For privacy concerns or data deletion requests, contact the repository maintainer.