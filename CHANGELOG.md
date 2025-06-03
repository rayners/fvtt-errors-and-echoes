# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [0.1.0] - 2024-12-08

### Added
- Initial release of Errors and Echoes module
- Anonymous error reporting system for FoundryVTT modules
- Privacy-first architecture with configurable privacy levels:
  - **Minimal**: Error message only
  - **Standard**: Error message + Foundry version + active modules
  - **Detailed**: Standard + browser info + scene context
- Author-configured error reporting endpoints
- Automatic error attribution system with confidence scoring
- Consent management with persistent user preferences
- Comprehensive privacy controls and opt-out mechanisms
- Real-time connectivity testing for configured endpoints
- Privacy details dialog for transparency
- Welcome dialog for first-time users
- Support for FoundryVTT v12.0+ with enhanced v13+ features
- Complete documentation suite:
  - User guide (README_FOUNDRY.md)
  - Developer guide (README.md)
  - API reference documentation
  - Privacy policy and GDPR compliance
  - Security vulnerability reporting process
  - Sentry-relay integration guide
  - Technical architecture documentation

### Security
- Anonymous-by-design data collection
- No personally identifiable information (PII) transmitted
- HTTPS-only endpoint communication
- Input sanitization and validation
- Secure settings storage in Foundry client settings
- Rate limiting and error filtering capabilities

### Technical
- TypeScript implementation with strict type checking
- Comprehensive error handling with graceful degradation
- Performance-optimized with minimal runtime overhead
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Module conflict detection and resolution
- Extension points for custom context providers
- Rollup-based build system with TypeScript compilation

[Unreleased]: https://github.com/rayners/fvtt-errors-and-echoes/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rayners/fvtt-errors-and-echoes/releases/tag/v0.1.0