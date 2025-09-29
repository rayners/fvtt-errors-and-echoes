# Claude Development Memory: Errors & Echoes

## 📂 Documentation Organization

**CRITICAL**: Follow universal documentation standards to keep repositories clean and professional.

### **Documentation Locations**
- **Repository**: Public documentation only (README files, user guides, API docs)
- **Local-docs** (`../local-docs/fvtt-errors-and-echoes/`): All private development documentation
- **Shared Standards**: [[../shared/DOCUMENTATION-STANDARDS.md]] - Universal standards for all modules

### **Documentation Rules** 
**❌ NEVER add to repository**:
- Development planning documents (`PHASE-*.md`, `*-IMPLEMENTATION.md`)
- Session logs and completion summaries
- Linear ticket references or internal planning details
- AI assistant instructions or development context
- Beta testing strategies or recruitment materials

**✅ ADD to local-docs instead**:
- **development/**: Implementation docs, AI context, technical details
- **planning/**: Release plans, beta strategies, conversion approaches  
- **architecture/**: Technical decisions, integration patterns
- **sessions/**: Development logs with ticket references and decisions

**✅ Repository documentation should**:
- Focus on user and developer value
- Use generic version references ("Added in v0.2.0")
- Reference public documentation only
- Acknowledge limitations honestly without internal context

### **File Organization Pattern**
```
Repository:                    Local-docs:
├── README.md                 ├── development/CLAUDE.md (symlinked)
├── CHANGELOG.md              ├── planning/PRE-RELEASE-CHECKLIST.md
├── API-REFERENCE.md          ├── architecture/SENTRY-RELAY-INTEGRATION.md
└── CONTRIBUTING.md           └── sessions/2025-06-04-*.md
```

## Project Overview
**Errors & Echoes** is a privacy-respecting error reporting and debugging module for FoundryVTT that helps module developers provide better support to their users while maintaining strict privacy controls.

## Core Architecture

### Key Components
- **Error Reporter** (`error-reporter.ts`) - Central error collection and reporting system
- **Consent Manager** (`consent-manager.ts`) - Privacy-first consent handling
- **Module Registry** (`module-registry.ts`) - Registration system for participating modules
- **Error Attribution** (`error-attribution.ts`) - Intelligent error categorization
- **Privacy Details Dialog** (`privacy-details-dialog.ts`) - User transparency interface

### API System
- **Registration API** - Allows modules to register for enhanced error reporting
- **Reporting API** - Structured error submission with context
- **Attribution API** - Automatic error source identification
- **Privacy API** - User consent and data control

## Current Status

### Module State
- **Version**: Latest stable release available on GitHub
- **Compatibility**: FoundryVTT v11+ (designed for modern Foundry versions)
- **Privacy Compliance**: GDPR-compliant with opt-in telemetry
- **Integration**: Works with any FoundryVTT module via registration API

### Key Features
- **Privacy-First Design**: All error reporting is opt-in with clear user control
- **Module Integration**: Easy registration API for module developers
- **Error Attribution**: Intelligent identification of error sources
- **User Transparency**: Clear privacy details and data control
- **Developer Tools**: Enhanced debugging capabilities for registered modules

## Integration Patterns

### Module Registration
```typescript
// Register module with Errors & Echoes
if (game.modules.get('errors-and-echoes')?.active) {
  game.errorsAndEchoes?.registerModule({
    id: 'module-id',
    name: 'Module Name',
    version: 'x.y.z',
    author: 'Author Name',
    supportEmail: 'support@example.com'
  });
}
```

### Error Reporting
```typescript
// Report errors with context
try {
  await riskyOperation();
} catch (error) {
  game.errorsAndEchoes?.reportError(error, {
    module: 'module-id',
    component: 'component-name',
    action: 'action-name',
    context: { additionalData: 'value' }
  });
  throw error; // Re-throw for normal error handling
}
```

## Privacy Design

### Core Principles
- **Opt-in Only**: No data collection without explicit user consent
- **Transparent**: Users see exactly what data is being collected
- **User Control**: Complete control over data sharing and deletion
- **Minimal Data**: Only collect what's necessary for debugging
- **No PII**: Personal information is never collected or transmitted

### Consent Management
- **Welcome Dialog**: Clear explanation of error reporting benefits
- **Privacy Details**: Comprehensive privacy policy and data handling
- **Settings Integration**: Easy opt-in/opt-out controls
- **Module-Specific**: Users can control reporting per module

## Development Environment

### Build System
- **Rollup**: Module bundling with TypeScript support
- **Vitest**: Unit testing framework
- **CSS**: Standard CSS for styling
- **Node.js**: Development toolchain

### Testing Strategy
- **Unit Tests**: Core error handling and privacy logic
- **Integration Tests**: Module registration and reporting workflows
- **Privacy Tests**: Consent management and data handling
- **Mock Framework**: FoundryVTT API mocking for isolated testing

## File Structure
```
src/
  error-reporter.ts       # Central error collection
  consent-manager.ts      # Privacy and consent handling
  module-registry.ts      # Module registration system
  error-attribution.ts    # Error source identification
  error-capture.ts        # Error interception system
  privacy-details-dialog.ts # Privacy transparency UI
  settings-ui.ts          # User settings interface
  author-utils.ts         # Module author utilities
templates/
  privacy-details.hbs     # Privacy information dialog
  settings-config.hbs     # Settings configuration
  welcome-dialog.hbs      # Welcome and consent dialog
examples/
  generic-module.js       # Basic integration example
  journeys-and-jamborees.js # Advanced integration example
  simple-weather.js       # Real-world integration example
```

## Future Considerations

### Enhanced Features
- **Advanced Error Analytics**: Pattern recognition for common issues
- **Automated Issue Creation**: GitHub integration for automatic bug reports
- **Performance Monitoring**: Optional performance data collection
- **Error Trends**: Aggregate error trend reporting for developers

### Integration Opportunities
- **J&J Integration**: Enhanced party management error reporting
- **S&S Integration**: Calendar operation error handling
- **Module Ecosystem**: Integration with other rayners modules
- **Community Modules**: API adoption by community developers

## Development Patterns

### Error Handling Philosophy
- **Fail Gracefully**: Errors in E&E should never break host modules
- **Silent Degradation**: Missing E&E should not affect module functionality
- **Clear Attribution**: Always identify the true source of errors
- **User-Friendly**: Error messages should be actionable for users

### Privacy-First Development
- **Assume No Consent**: Default to no data collection
- **Transparent Processing**: Users understand what data is collected
- **Minimal Collection**: Only collect data needed for specific purposes
- **User Control**: Users can modify or delete their data at any time

## Documentation Standards Applied

### Repository Documentation (Public)
- **API-REFERENCE.md**: Complete developer integration guide
- **COMMUNITY-FAQ.md**: User questions and answers
- **CONTRIBUTING.md**: Developer contribution guidelines
- **FOUNDRY-COMPATIBILITY.md**: Version compatibility information
- **LEGAL-COMPLIANCE.md**: Legal and privacy compliance
- **PRIVACY-POLICY.md**: User privacy rights and data handling
- **README.md & README_FOUNDRY.md**: Project overview and usage
- **REGISTRATION-API-EXAMPLES.md**: Integration examples
- **SECURITY.md**: Security practices and reporting

### Local-docs Organization (Private)
- **architecture/**: Technical architecture and integration patterns
- **development/**: Implementation details and development context
- **planning/**: Release planning and internal coordination
- **sessions/**: Development logs and session summaries

This organization ensures clean, professional repositories focused on user and developer value while maintaining comprehensive development documentation in local-docs for persistence across sessions.