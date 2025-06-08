# Changelog

All notable changes to the Errors and Echoes module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-06-08

### Added

- **Complete Registration API** - Full module integration system allowing developers to register context providers and error filters
- **Privacy-First Architecture** - Three configurable privacy levels (Minimal, Standard, Detailed) with transparent data collection
- **Enhanced Settings UI** - Visual display of registered modules with feature badges and activity metrics
- **Production-Ready Infrastructure** - Deployed sentry-relay at https://errors.rayners.dev with security hardening
- **Working Integration Examples** - Real-world examples for Journeys & Jamborees, Simple Weather, and generic modules
- **Test Infrastructure** - Unit test framework established (current status: tests need fixes for full functionality)
- **Privacy Compliance** - GDPR-compliant with complete user rights documentation
- **Error Attribution System** - Multi-strategy attribution with confidence scoring for accurate module identification
- **Rate Limiting** - 50 reports per hour with 1-minute deduplication to prevent spam
- **Context Enhancement** - Rich debugging context from registered modules for improved troubleshooting
- **Error Filtering** - Module-specific filtering to reduce noise and focus on relevant errors
- **Consent Management** - User-controllable privacy settings with clear explanations
- **Manual Reporting** - API for explicit error reporting with custom context
- **Author-based Routing** - Separate error tracking per module author for organized monitoring
- **Security Features** - Input validation, sanitization, CORS protection, and secure transmission
- **Documentation Suite** - Complete user and developer documentation with API reference
- **Legal Framework** - MIT license with privacy policy and legal compliance documentation

### Technical Features

- **TypeScript Implementation** - Full TypeScript codebase with comprehensive type safety
- **Modern Build System** - Rollup-based build with automated testing and quality checks
- **Foundry v12+ Support** - Compatible with Foundry VTT v12.0.0 through v13.999.999
- **Lightweight Build** - 119KB compiled module with efficient resource usage
- **Performance Focused** - Minimal startup overhead and fast error processing
- **Hook Integration** - Deep integration with Foundry VTT lifecycle and error handling
- **Graceful Degradation** - Works without network connectivity and handles service unavailability
- **Debug Mode** - Configurable debug logging for development and troubleshooting

### Developer Experience

- **Registration API** - Simple `window.ErrorsAndEchoes.API.register()` integration
- **Context Providers** - Rich debugging context with custom data from modules
- **Error Filters** - Module-specific filtering to reduce noise in error reports
- **Integration Examples** - Working examples for popular module types
- **API Documentation** - Complete TypeScript interfaces and usage examples
- **Testing Utilities** - Mock framework and integration testing helpers

### User Experience

- **Privacy Transparency** - Clear explanations of data collection at each privacy level
- **User Control** - Complete control over data sharing with easy opt-out
- **Visual Feedback** - Settings UI shows registered modules and activity
- **No Disruption** - Error reporting is invisible and never affects gameplay
- **Clear Documentation** - User-friendly installation and configuration guides

### Infrastructure

- **Production Deployment** - Secure sentry-relay deployed at https://errors.rayners.dev
- **Rate Limiting** - 50 reports per hour with burst protection
- **Input Validation** - Comprehensive validation and sanitization of all data
- **CORS Protection** - Proper cross-origin request handling
- **Security Headers** - Complete security header implementation
- **Health Monitoring** - Health check endpoints for service monitoring
- **Error Logging** - Structured logging for debugging and monitoring


## [Unreleased]

### Planned Features

- **Enhanced Analytics** - Aggregated error pattern analysis and reporting
- **Additional Context Providers** - More built-in context providers for common debugging scenarios
- **Advanced Filtering** - More sophisticated error filtering capabilities
- **Internationalization** - Multi-language support for user interface
- **Module Marketplace Integration** - Integration with FoundryVTT package browser
- **Performance Enhancements** - Further optimization based on production usage data

---

## Version History

- **v0.1.2** (2025-06-08): Current release with core functionality and infrastructure
- **Pre-release Development** (2024-2025): Documentation-first development with privacy framework

---

_For user guidance, see the [User Guide](README_FOUNDRY.md)._  
_For developer integration, see the [API Reference](API-REFERENCE.md)._  
_For integration examples, see the [examples directory](examples/)._
