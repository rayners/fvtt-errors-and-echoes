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

## [0.1.0] - 2025-06-03

### Added
- **Module Registration API**: Complete registration system for enhanced error reporting
  - Context providers for debugging information
  - Error filters for noise reduction  
  - Custom endpoint configuration
  - Real-time statistics tracking
- **Enhanced Settings UI**: Visual interface for managing error reporting
  - Registered modules display with feature badges
  - Usage statistics and call counts
  - Registration summary with activity metrics
  - Protected endpoint management
- **Integration Examples**: Working examples for module developers
  - Journeys and Jamborees integration example
  - Simple Weather integration example  
  - Generic module template with comprehensive documentation
- **Comprehensive Testing**: Production-ready test suite
  - 35 automated tests with 100% pass rate
  - Integration testing for Registration API
  - End-to-end workflow testing
  - Mock Foundry environment for reliable testing
- **Error Capture System**: Advanced error detection and attribution
  - JavaScript errors, promise rejections, console errors
  - Foundry hook error capture
  - Stack trace analysis for module attribution
  - Hook context detection
- **Privacy Controls**: Granular privacy management
  - Three privacy levels (minimal, standard, detailed)
  - Opt-in only error reporting
  - Per-endpoint consent management
  - Anonymous session handling
- **Foundry Integration**: Native Foundry VTT integration
  - ApplicationV2 settings interface
  - Foundry v12-v13 compatibility
  - Module settings system integration
  - Proper localization support

### Security
- **Production-Ready Security**: Comprehensive security implementation
  - Rate limiting with configurable thresholds
  - Input validation and data sanitization
  - Request size limits and malicious payload detection
  - Proper CORS configuration
  - Environment-based origin validation
- Anonymous-by-design data collection
- No personally identifiable information (PII) transmitted
- HTTPS-only endpoint communication
- Secure settings storage in Foundry client settings

### Technical
- **TypeScript Implementation**: Full TypeScript codebase with strict typing
- **Modern Build System**: Rollup with ES modules
- **Testing Infrastructure**: Vitest with jsdom for browser environment simulation
- **Documentation**: Complete API reference and integration guides
- Comprehensive error handling with graceful degradation
- Performance-optimized with minimal runtime overhead
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Module conflict detection and resolution

### Infrastructure
- **Sentry Relay Integration**: Cloudflare Worker for error forwarding
  - Author-based routing to different Sentry projects
  - Format transformation from Foundry to Sentry
  - Health monitoring and connectivity testing
  - Privacy-aware data handling

[Unreleased]: https://github.com/rayners/fvtt-errors-and-echoes/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rayners/fvtt-errors-and-echoes/releases/tag/v0.1.0