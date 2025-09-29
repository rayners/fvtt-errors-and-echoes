# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **`npm run dev`** - Start development with watch mode (Rollup)
- **`npm run build`** - Production build
- **`npm run clean`** - Remove dist directory
- **`npm run validate`** - Run all checks (lint, format, typecheck, test, build)

### Testing
- **`npm test`** or **`npm run test:run`** - Run full test suite (142 tests)
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:ui`** - Open Vitest UI
- **`npm run test:coverage`** - Generate coverage report
- **`npm run test:coverage:junit`** - CI-compatible test run with coverage

### Code Quality
- **`npm run lint`** - ESLint check
- **`npm run lint:fix`** - Auto-fix ESLint issues
- **`npm run typecheck`** - TypeScript type checking
- **`npm run format`** - Prettier formatting
- **`npm run format:check`** - Check formatting

## Architecture Overview

### Core Components
This module implements a privacy-first error reporting system with the following architecture:

- **ErrorCapture** (`src/error-capture.ts`) - Global error listeners (window.onerror, unhandledrejection, console hooks)
- **ErrorAttribution** (`src/error-attribution.ts`) - Advanced stack trace analysis to identify source modules
- **ErrorReporter** (`src/error-reporter.ts`) - HTTP reporting with rate limiting and deduplication
- **ConsentManager** (`src/consent-manager.ts`) - Privacy controls and user consent
- **ModuleRegistry** (`src/module-registry.ts`) - Module registration and configuration
- **WelcomeDialog** (`src/welcome-dialog.ts`) - First-run consent UI

### API Design Pattern
The module exposes both:
1. **Global API** via `window.ErrorsAndEchoes.API`
2. **Module API** via `game.modules.get('errors-and-echoes').api`
3. **Hook Integration** via `Hooks.on('errorsAndEchoesReady', api => {})`

### Privacy-First Architecture
All error reporting follows privacy-by-design:
- **Opt-in only** - No data collection without explicit consent
- **Three privacy levels** - minimal, standard, detailed
- **Per-endpoint consent** - Users control which endpoints receive data
- **No PII collection** - Personal information is actively filtered out

### Testing Strategy
- **Unit Tests** - Individual component testing with Vitest
- **Integration Tests** - Component interaction testing
- **E2E Tests** - Full workflow validation
- **Foundry Mocks** - `@rayners/foundry-test-utils` for isolation
- **Coverage Targets** - 80% minimum across all metrics

## Key Integration Patterns

### Module Registration
Modules register via the API to enable enhanced error reporting:
```typescript
game.errorsAndEchoes?.register({
  id: 'module-id',
  name: 'Module Name',
  version: '1.0.0',
  author: 'Author Name',
  supportEmail: 'support@example.com'
});
```

### Error Attribution Logic
The system uses sophisticated stack trace analysis to identify which module caused an error:
1. **Stack trace parsing** - Extract file paths from error stacks
2. **Module path matching** - Match `/modules/module-id/` patterns
3. **Hook context detection** - Identify errors during Foundry hook execution
4. **Confidence scoring** - Rate attribution accuracy

### Endpoint Resolution
Error reports are routed to endpoints based on:
1. **Module-specific endpoints** - Registered via ModuleRegistry
2. **Author matching** - Configured endpoints that match module authors
3. **Explicit module lists** - Endpoints with specific module allowlists

## Build System

### Rollup Configuration
Uses `@rayners/foundry-dev-tools` for standardized Foundry module builds:
- **CSS handling** - Plain CSS (no SCSS processing)
- **Copy targets** - Examples and styles directories
- **ES modules** - Modern module output for Foundry v12+

### TypeScript Configuration
- **Strict mode** enabled except `noImplicitAny: false` for Foundry compatibility
- **ES2020 target** for broad browser compatibility
- **ESNext modules** with Node resolution

## Development Notes

### Error Handling Philosophy
- **Never swallow errors** - All errors remain visible to users
- **Fail gracefully** - E&E failures don't break host modules
- **Silent degradation** - Missing E&E doesn't affect module functionality

### Testing Requirements
- All new error handling code must have unit tests
- Integration tests required for API changes
- Coverage must not drop below 80% on any metric
- Foundry API interactions must be mocked for CI

### Privacy Compliance
- All data collection must be opt-in
- User consent required before any HTTP requests
- PII filtering enforced at collection time
- Transparent data handling in UI

## Development Context

For comprehensive development standards and patterns, see:
- [Development Context Reference](../dev-context/README.md)

Specific areas:
- Development workflow: [../dev-context/foundry-development-practices.md](../dev-context/foundry-development-practices.md)
- Testing standards: [../dev-context/testing-practices.md](../dev-context/testing-practices.md)
- Architecture patterns: [../dev-context/module-architecture-patterns.md](../dev-context/module-architecture-patterns.md)
- Documentation standards: [../dev-context/documentation-standards.md](../dev-context/documentation-standards.md)
- Automation infrastructure: [../dev-context/automation-infrastructure.md](../dev-context/automation-infrastructure.md)

### Quick Reference from Dev Context

**CRITICAL FIRST**: Always read [AI Code Access Restrictions](../dev-context/ai-code-access-restrictions.md) to understand security boundaries around FoundryVTT proprietary code.

**Pre-Commit Workflow**:
1. `npm run lint` - ESLint validation
2. `npm run typecheck` - TypeScript validation
3. `npm run test:run` - Full test suite (NEVER `npm run test:workspaces`)
4. `npm run build` - Production build validation

**Quality Standards Applied**:
- **Documentation Accuracy**: All claims must be verifiable in code
- **No Hyperbole**: Avoid "works with all systems", "fully tested", "production ready"
- **TDD Workflow**: Tests first, then implementation for new features
- **90%+ Coverage**: Required for core business logic
- **System-Agnostic Design**: Graceful degradation across game systems

**Architecture Principles**:
- **Provider Pattern**: System-agnostic integration adapters
- **Feature Detection**: Runtime capability discovery
- **Error Resilience**: Comprehensive fallback strategies
- **Clean Separation**: Never modify target systems directly