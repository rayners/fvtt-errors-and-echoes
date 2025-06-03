# Contributing to Errors and Echoes

Thank you for your interest in contributing to Errors and Echoes! This document provides guidelines for contributing to this privacy-focused error reporting module for FoundryVTT.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Privacy and Security](#privacy-and-security)
- [Documentation](#documentation)

## Code of Conduct

This project follows the standard [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- FoundryVTT for testing (v12.0+ recommended)
- Basic knowledge of TypeScript and FoundryVTT module development

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/fvtt-errors-and-echoes.git
   cd fvtt-errors-and-echoes
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Module**
   ```bash
   npm run build
   ```

4. **Development Mode** (auto-rebuild on changes)
   ```bash
   npm run dev
   ```

5. **Type Checking**
   ```bash
   npm run typecheck
   ```

## Code Style and Standards

### TypeScript Configuration

This project uses strict TypeScript settings with the following key requirements:

- **Strict Mode**: All code must pass `strict: true` type checking
- **No Implicit Any**: All types must be explicitly declared
- **Unused Variables**: No unused locals or parameters allowed
- **Target**: ES2022 with DOM support
- **Module System**: ES2022 modules

### Code Style Guidelines

#### General Principles
- **Privacy First**: Always consider privacy implications of any data collection or transmission
- **Graceful Degradation**: Code must handle missing dependencies gracefully
- **Error Handling**: Never swallow errors; always propagate or log appropriately
- **Performance**: Minimize runtime overhead and memory usage

#### Naming Conventions
- **Classes**: PascalCase (`ErrorReporter`, `ConsentManager`)
- **Functions/Methods**: camelCase (`reportError`, `getUserConsent`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PRIVACY_LEVEL`, `MAX_CONTEXT_SIZE`)
- **Interfaces**: PascalCase with descriptive names (`ErrorReportData`, `ModuleRegistrationConfig`)
- **Files**: kebab-case (`error-reporter.ts`, `consent-manager.ts`)

#### TypeScript Specific
- Use explicit return types for all public methods
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable properties
- Avoid `any` - use proper typing or `unknown`
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate

#### Example Code Style
```typescript
interface ErrorReportData {
  readonly message: string;
  readonly timestamp: number;
  readonly privacyLevel: PrivacyLevel;
  readonly moduleId?: string;
}

class ErrorReporter {
  private readonly settings: ConsentManager;

  constructor(settings: ConsentManager) {
    this.settings = settings;
  }

  public async reportError(
    error: Error,
    options: ReportOptions = {}
  ): Promise<boolean> {
    if (!this.settings.hasConsent()) {
      return false;
    }

    const reportData = this.buildReportData(error, options);
    return this.transmitReport(reportData);
  }

  private buildReportData(
    error: Error,
    options: ReportOptions
  ): ErrorReportData {
    // Implementation
  }
}
```

### JSDoc Documentation

All public APIs must include comprehensive JSDoc:

```typescript
/**
 * Reports an error to configured endpoints with privacy controls.
 * 
 * @param error - The error to report
 * @param options - Configuration options for the report
 * @returns Promise resolving to true if successfully transmitted
 * 
 * @example
 * ```typescript
 * const success = await errorReporter.reportError(
 *   new Error("Something went wrong"),
 *   { privacyLevel: "standard", moduleId: "my-module" }
 * );
 * ```
 */
public async reportError(
  error: Error,
  options: ReportOptions = {}
): Promise<boolean>
```

## Testing

### Current Testing Setup

Currently, the project uses manual testing procedures. Automated testing contributions are welcome and encouraged.

### Manual Testing Checklist

Before submitting PRs, verify:

1. **Privacy Controls**
   - [ ] All privacy levels work correctly
   - [ ] Consent can be granted and withdrawn
   - [ ] No PII is transmitted at any privacy level

2. **Error Reporting**
   - [ ] Errors are correctly attributed to modules
   - [ ] Endpoints receive properly formatted data
   - [ ] Failed transmissions are handled gracefully

3. **FoundryVTT Integration**
   - [ ] Module loads without errors in v12 and v13+
   - [ ] Settings UI functions correctly
   - [ ] No conflicts with other modules

4. **Cross-Browser Testing**
   - [ ] Chrome/Chromium
   - [ ] Firefox
   - [ ] Safari (if available)
   - [ ] Edge

### Adding Tests

Contributions of automated tests are highly encouraged. Preferred frameworks:
- **Unit Tests**: Jest or Vitest
- **Integration Tests**: Foundry-compatible test runner
- **E2E Tests**: Playwright or similar

## Pull Request Process

### Before Submitting

1. **Code Quality**
   - [ ] TypeScript compilation passes (`npm run typecheck`)
   - [ ] Code follows style guidelines
   - [ ] All public APIs documented with JSDoc
   - [ ] Manual testing completed

2. **Privacy Review**
   - [ ] No new PII collection introduced
   - [ ] Privacy implications documented
   - [ ] Consent mechanisms respected

3. **Documentation**
   - [ ] README.md updated if API changes
   - [ ] CHANGELOG.md entry added
   - [ ] JSDoc comments added/updated

### PR Template

Please include:

1. **Description**: What changes were made and why
2. **Privacy Impact**: Any privacy implications of the changes
3. **Testing**: How the changes were tested
4. **Breaking Changes**: Any API or behavior changes
5. **Documentation**: What documentation was updated

### Review Process

1. **Automated Checks**: TypeScript compilation and basic validation
2. **Code Review**: Focus on privacy, security, and code quality
3. **Testing**: Manual verification of functionality
4. **Documentation Review**: Ensure all changes are documented

## Issue Reporting

### Bug Reports

Please include:

1. **Environment**
   - FoundryVTT version
   - Browser and version
   - Operating system
   - Module version

2. **Steps to Reproduce**
   - Detailed steps to trigger the issue
   - Expected vs. actual behavior
   - Screenshots if helpful

3. **Privacy Context**
   - Current privacy settings
   - Whether error reporting was enabled
   - Any error messages in console

### Feature Requests

Consider:

1. **Privacy Impact**: How does this affect user privacy?
2. **Use Case**: What problem does this solve?
3. **Alternatives**: What existing solutions were considered?
4. **Implementation**: Any thoughts on implementation approach?

### Security Issues

**DO NOT** report security vulnerabilities in public issues. Please follow the [Security Policy](SECURITY.md) for responsible disclosure.

## Privacy and Security

### Core Principles

1. **Anonymous by Design**: No PII should ever be collected or transmitted
2. **User Consent**: All data collection requires explicit user consent
3. **Transparency**: Users must understand exactly what data is collected
4. **Control**: Users must be able to opt out at any time

### Privacy Guidelines for Contributors

- **Review All Data**: Audit any data being collected or transmitted
- **Minimize Collection**: Only collect data essential for error reporting
- **Secure Transmission**: Ensure HTTPS and proper validation
- **Documentation**: Document privacy implications of changes

### Security Guidelines

- **Input Validation**: Sanitize all external inputs
- **Dependency Security**: Keep dependencies updated
- **Error Handling**: Don't expose sensitive information in errors
- **Code Review**: All PRs reviewed for security implications

## Documentation

### Documentation Standards

- **User-Focused**: README_FOUNDRY.md should be accessible to non-technical users
- **Developer-Focused**: README.md and API docs should enable quick integration
- **Privacy-First**: Always lead with privacy implications
- **Complete Examples**: Include working code examples
- **Version Compatibility**: Note FoundryVTT version requirements

### Documentation Types

1. **User Documentation** (README_FOUNDRY.md)
   - Installation and setup
   - Privacy controls explanation
   - Troubleshooting

2. **Developer Documentation** (README.md, API-REFERENCE.md)
   - Integration examples
   - API reference
   - Architecture overview

3. **Supporting Documentation**
   - CHANGELOG.md for release notes
   - SECURITY.md for vulnerability reporting
   - PRIVACY-POLICY.md for legal compliance

### Updating Documentation

- Update relevant documentation with all changes
- Test all code examples before committing
- Review from both user and developer perspectives
- Ensure privacy implications are clearly explained

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: Contact @rayners78 for urgent security issues

Thank you for contributing to Errors and Echoes! Your contributions help make FoundryVTT module development more reliable while respecting user privacy.