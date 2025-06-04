# Testing and Validation Guide

This document provides comprehensive testing procedures for the Errors and Echoes module to ensure functionality, privacy compliance, and performance standards.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Manual Testing Procedures](#manual-testing-procedures)
- [Privacy Compliance Testing](#privacy-compliance-testing)
- [Performance Testing](#performance-testing)
- [Integration Testing](#integration-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Test Environment Setup](#test-environment-setup)
- [Automated Testing](#automated-testing)
- [Release Testing Checklist](#release-testing-checklist)

## Testing Overview

### Testing Philosophy

- **Privacy First**: Every test must verify privacy compliance
- **User Safety**: Ensure no data leakage or unexpected behavior
- **Real-World Scenarios**: Test with actual modules and error conditions
- **Cross-Platform**: Verify functionality across supported environments

### Test Categories

1. **Functional Testing**: Core features work as expected
2. **Privacy Testing**: No unauthorized data collection or transmission
3. **Performance Testing**: Minimal impact on FoundryVTT performance
4. **Integration Testing**: Compatibility with modules and systems
5. **Security Testing**: Input validation and secure communication

## Manual Testing Procedures

### 1. Initial Module Installation

**Objective**: Verify clean installation and first-run experience

**Steps**:
1. Install module in fresh FoundryVTT instance
2. Enable module in world
3. Observe initial welcome dialog
4. Verify default settings (should be most private)

**Expected Results**:
- Welcome dialog appears with privacy explanation
- Default privacy level is "Minimal"
- No errors in console
- Settings accessible via module settings

**Privacy Verification**:
- No network requests made during installation
- No data stored beyond user preferences

### 2. Privacy Level Configuration

**Objective**: Test all privacy levels and their data collection

**Test Cases**:

#### 2.1 Minimal Privacy Level
**Steps**:
1. Set privacy level to "Minimal"
2. Trigger test error via console: `throw new Error("Test error")`
3. Monitor network traffic
4. Verify reported data

**Expected Data**:
- Error message only
- No browser information
- No FoundryVTT version
- No module information
- No scene context

#### 2.2 Standard Privacy Level
**Steps**:
1. Set privacy level to "Standard"
2. Trigger test error
3. Monitor network traffic
4. Verify reported data

**Expected Data**:
- Error message
- FoundryVTT version
- List of active modules (names only)
- No browser information
- No scene context

#### 2.3 Detailed Privacy Level
**Steps**:
1. Set privacy level to "Detailed"
2. Trigger test error
3. Monitor network traffic
4. Verify reported data

**Expected Data**:
- Error message
- FoundryVTT version
- Active modules with versions
- Browser type and version (no unique identifiers)
- Scene name and ID
- No personally identifiable information

### 3. Consent Management Testing

**Objective**: Verify user consent controls work correctly

**Test Cases**:

#### 3.1 Consent Withdrawal
**Steps**:
1. Enable error reporting
2. Trigger error (should report)
3. Disable error reporting in settings
4. Trigger error (should not report)
5. Re-enable and test again

**Expected Results**:
- Errors only reported when consent is active
- No network requests when disabled
- Settings persist across browser sessions

#### 3.2 Privacy Details Dialog
**Steps**:
1. Open privacy details dialog from settings
2. Review all displayed information
3. Verify accuracy against actual data collection

**Expected Results**:
- Clear explanation of data collection at each level
- Accurate description of current privacy level
- No technical jargon in explanations

### 4. Error Attribution Testing

**Objective**: Verify errors are correctly attributed to modules

**Test Cases**:

#### 4.1 Known Module Error
**Steps**:
1. Install a test module that throws known errors
2. Enable error reporting at "Standard" level
3. Trigger error from test module
4. Verify attribution in report

**Expected Results**:
- Error correctly attributed to test module
- High confidence score (>0.8)
- Module name and version included

#### 4.2 Core FoundryVTT Error
**Steps**:
1. Trigger error from core FoundryVTT code
2. Verify attribution

**Expected Results**:
- Error attributed to "foundry-core" or similar
- Lower confidence score due to core attribution
- No specific module blamed

#### 4.3 Unknown Source Error
**Steps**:
1. Trigger error from unknown source (e.g., browser extension)
2. Verify attribution

**Expected Results**:
- Error marked as "unknown" source
- Low confidence score (<0.5)
- Clear indication of uncertainty

### 5. Endpoint Configuration Testing

**Objective**: Test error reporting endpoint configuration

**Test Cases**:

#### 5.1 Valid Endpoint Configuration
**Steps**:
1. Configure valid test endpoint (use sentry-relay or webhook.site)
2. Test connectivity
3. Trigger error report
4. Verify receipt at endpoint

**Expected Results**:
- Connectivity test passes
- Error report received at endpoint
- Proper JSON format with expected fields

#### 5.2 Invalid Endpoint Configuration
**Steps**:
1. Configure invalid endpoint URL
2. Test connectivity
3. Attempt error report

**Expected Results**:
- Connectivity test fails with clear error message
- No error reports sent to invalid endpoint
- User warned about configuration issue

#### 5.3 Endpoint Timeout Testing
**Steps**:
1. Configure endpoint with artificial delay
2. Test with various timeout scenarios

**Expected Results**:
- Reasonable timeout handling (5-10 seconds)
- No browser hang or freeze
- Clear error message on timeout

## Privacy Compliance Testing

### Data Collection Audit

**For each privacy level, verify EXACTLY what data is collected**:

#### Minimal Level Audit
```javascript
// Test code to intercept and log all transmitted data
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch called with:', args);
  return originalFetch.apply(this, args);
};
```

**Required Verification**:
- Only error message transmitted
- No browser fingerprinting data
- No user identifiers
- No session tokens
- No IP address logging (verify server-side)

#### Standard Level Audit
**Additional Data Allowed**:
- FoundryVTT version (exact version string)
- Active module names (no versions or configurations)
- Error timestamp (rounded to hour, not precise time)

#### Detailed Level Audit
**Additional Data Allowed**:
- Browser user agent (sanitized)
- Active module versions
- Scene context (name/ID, no content)
- Error stack trace (with paths sanitized)

### GDPR Compliance Testing

1. **Right to Access**: User can view all data collected
2. **Right to Delete**: User can clear all stored preferences
3. **Right to Object**: User can disable all data collection
4. **Data Minimization**: Only essential data collected at each level
5. **Purpose Limitation**: Data only used for error reporting

## Performance Testing

### Baseline Performance Measurement

**Test Environment**:
- FoundryVTT with 20+ modules active
- Large scene with 100+ tokens
- Multiple connected players

**Metrics to Measure**:
1. **Module Load Time**: Time to initialize Errors and Echoes
2. **Error Handling Overhead**: Additional time per error
3. **Memory Usage**: RAM consumption by module
4. **Network Impact**: Bandwidth usage for error reports

### Performance Test Procedures

#### 1. Load Time Testing
**Steps**:
1. Measure FoundryVTT startup time without module
2. Enable Errors and Echoes
3. Measure startup time with module
4. Calculate overhead

**Acceptable Results**:
- <100ms additional startup time
- <1MB additional memory usage
- No noticeable impact on UI responsiveness

#### 2. Error Handling Performance
**Steps**:
1. Create performance test harness
2. Generate 100 test errors rapidly
3. Measure processing time per error
4. Monitor memory usage during test

**Acceptable Results**:
- <5ms processing time per error
- No memory leaks
- No UI blocking or freezing

#### 3. Network Performance
**Steps**:
1. Monitor network usage during normal operation
2. Trigger various error scenarios
3. Measure bandwidth consumption

**Acceptable Results**:
- <1KB per error report (standard level)
- No unnecessary network requests
- Proper batching if multiple errors occur

## Integration Testing

### Module Compatibility Testing

**Test with common module combinations**:

#### High-Priority Modules
- **Core Enhancement Modules**: Lib-Wrapper, SocketLib, Settings Extender
- **Popular UI Modules**: Tidy5e Sheet, Token Action HUD
- **System Modules**: DnD5e Helpers, PF2e Workbench
- **Popular Automation**: Midi-QOL, Dynamic Active Effects

#### Test Procedures
1. Install Errors and Echoes + target module
2. Perform typical workflows
3. Trigger intentional errors
4. Verify no conflicts or unexpected behavior

### System Compatibility Testing

**Test with major game systems**:
- D&D 5e
- Pathfinder 2e
- SWADE
- Call of Cthulhu 7e
- Simple World Building

**Verification Points**:
- Module loads without errors
- Error attribution works correctly
- No system-specific functionality broken

## Cross-Browser Testing

### Supported Browsers

**Primary Support** (full testing):
- Chrome/Chromium 100+
- Firefox 100+
- Safari 15+
- Edge 100+

**Secondary Support** (basic functionality):
- Chrome/Chromium 90-99
- Firefox 90-99
- Safari 14

### Browser-Specific Tests

#### Chrome/Chromium
- Test with various security settings
- Verify extension compatibility
- Test developer tools integration

#### Firefox
- Test with Enhanced Tracking Protection
- Verify add-on compatibility
- Test private browsing mode

#### Safari
- Test with Intelligent Tracking Prevention
- Verify iOS Safari compatibility (if applicable)
- Test Reader Mode impact

#### Edge
- Test with Microsoft Defender SmartScreen
- Verify Windows integration features

## Test Environment Setup

### Development Testing Environment

**Requirements**:
- FoundryVTT v12.0+ and v13.0+
- Node.js 18+ for build tools
- Test modules for error generation
- Network monitoring tools (Browser DevTools, Wireshark)

### Test Data Setup

#### Test Error Generation Module
```javascript
// Simple test module to generate predictable errors
class TestErrorGenerator {
  static generateError(type) {
    switch(type) {
      case 'simple':
        throw new Error('Test error message');
      case 'complex':
        throw new TypeError('Complex error with stack trace');
      case 'async':
        return Promise.reject(new Error('Async error'));
    }
  }
}
```

#### Test Endpoints
- **Local Test Server**: Simple HTTP server for endpoint testing
- **Webhook.site**: Public webhook service for integration testing
- **Sentry Test Project**: Full Sentry integration testing

### Network Monitoring Setup

**Tools**:
- Browser Developer Tools (Network tab)
- Charles Proxy or Fiddler for detailed inspection
- Wireshark for low-level network analysis

**Monitoring Points**:
- All HTTP/HTTPS requests
- Request headers and body content
- Response codes and timing
- Any unexpected network activity

## Automated Testing

### Future Automated Testing Goals

**Unit Tests**:
- Error attribution algorithm testing
- Privacy level data filtering
- Consent management logic
- Settings validation

**Integration Tests**:
- FoundryVTT hook integration
- Module lifecycle testing
- Cross-module compatibility

**E2E Tests**:
- Complete user workflows
- Privacy configuration scenarios
- Error reporting end-to-end

### Testing Framework Recommendations

**JavaScript/TypeScript**:
- Jest or Vitest for unit tests
- Playwright for E2E testing
- Testing Library for DOM testing

**FoundryVTT Specific**:
- Quench for in-FoundryVTT testing
- Custom test runner for module integration

## Release Testing Checklist

### Pre-Release Testing

**Functional Testing**:
- [ ] All privacy levels work correctly
- [ ] Error attribution accuracy >90%
- [ ] Consent management functions properly
- [ ] Settings UI is accessible and functional
- [ ] Network communication secure and reliable

**Privacy Compliance**:
- [ ] Data collection matches documented levels
- [ ] No PII transmitted at any level
- [ ] User consent required and respected
- [ ] Privacy details accurate and complete

**Performance**:
- [ ] <100ms startup overhead
- [ ] <5ms per error processing time
- [ ] <1MB memory usage
- [ ] No UI blocking or freezing

**Compatibility**:
- [ ] FoundryVTT v12.0+ compatibility
- [ ] Major browser compatibility
- [ ] Core module compatibility
- [ ] Popular system compatibility

**Documentation**:
- [ ] All documentation accurate and complete
- [ ] Code examples tested and functional
- [ ] Privacy explanations clear and accurate
- [ ] Installation instructions verified

### Post-Release Monitoring

**Metrics to Track**:
- Error report volume and types
- Privacy level distribution
- Performance impact reports
- Compatibility issues
- User feedback and issues

**Response Procedures**:
- Critical privacy issues: Immediate hotfix
- Performance issues: Next minor release
- Compatibility issues: Coordinate with affected modules
- Documentation issues: Update within 24 hours

## Test Execution Logs

### Test Run Template

```
Test Run: [Date]
Tester: [Name]
Environment: FoundryVTT [version], [Browser] [version], [OS]

Functional Tests:
[ ] Privacy Level Configuration
[ ] Consent Management
[ ] Error Attribution
[ ] Endpoint Configuration

Privacy Tests:
[ ] Data Collection Audit (Minimal)
[ ] Data Collection Audit (Standard)
[ ] Data Collection Audit (Detailed)
[ ] GDPR Compliance

Performance Tests:
[ ] Load Time: [ms]
[ ] Error Processing: [ms per error]
[ ] Memory Usage: [MB]

Issues Found:
[List any issues discovered during testing]

Overall Result: [PASS/FAIL]
Notes: [Additional observations]
```

This testing guide ensures comprehensive validation of the Errors and Echoes module's functionality, privacy compliance, and performance characteristics before release.