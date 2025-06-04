# FoundryVTT Compatibility and Troubleshooting

This document provides comprehensive compatibility information and troubleshooting guidance for the Errors and Echoes module across different FoundryVTT versions, browsers, and module configurations.

## Table of Contents

- [Compatibility Matrix](#compatibility-matrix)
- [FoundryVTT Version Compatibility](#foundryvtt-version-compatibility)
- [Browser Compatibility](#browser-compatibility)
- [Module Compatibility](#module-compatibility)
- [System Compatibility](#system-compatibility)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Installation Troubleshooting](#installation-troubleshooting)
- [Performance Troubleshooting](#performance-troubleshooting)
- [Privacy and Security Issues](#privacy-and-security-issues)
- [Advanced Troubleshooting](#advanced-troubleshooting)

## Compatibility Matrix

### Supported Configurations

| Component       | Minimum | Recommended | Maximum     |
| --------------- | ------- | ----------- | ----------- |
| FoundryVTT      | v12.0.0 | v13.0.0+    | v13.999.999 |
| Node.js (dev)   | 18.0.0  | 20.0.0+     | Latest LTS  |
| Chrome/Chromium | 100     | 120+        | Latest      |
| Firefox         | 100     | 115+        | Latest      |
| Safari          | 15      | 16+         | Latest      |
| Edge            | 100     | 120+        | Latest      |

### Platform Support

| Platform              | Status             | Notes                            |
| --------------------- | ------------------ | -------------------------------- |
| Windows 10/11         | ✅ Full Support    | All browsers supported           |
| macOS 11+             | ✅ Full Support    | Safari included                  |
| Linux (Ubuntu/Debian) | ✅ Full Support    | Chrome/Firefox recommended       |
| Linux (Other)         | ⚠️ Limited Testing | Should work with modern browsers |
| Mobile/Tablet         | ❌ Not Supported   | FoundryVTT limitation            |

## FoundryVTT Version Compatibility

### Version 13.x (Recommended)

**Status**: ✅ Full Support  
**Enhanced Features**:

- Improved ApplicationV2 integration
- Enhanced error context collection
- Better performance monitoring
- Native module dependency tracking

**Known Issues**: None

### Version 12.x

**Status**: ✅ Supported  
**Limitations**:

- Less detailed error context
- Manual module tracking fallbacks
- Reduced performance metrics

**Known Issues**:

- Some module attribution may be less accurate
- Performance impact slightly higher

### Version 11.x and Earlier

**Status**: ❌ Not Supported  
**Reason**: Missing critical APIs for safe error interception

## Browser Compatibility

### Chrome/Chromium (Recommended)

**Versions**: 100+  
**Status**: ✅ Full Support

**Features**:

- Best error reporting accuracy
- Full developer tools integration
- Optimal performance

**Known Issues**: None

### Firefox

**Versions**: 100+  
**Status**: ✅ Full Support

**Features**:

- Good error reporting accuracy
- Privacy-focused features compatible
- Strong performance

**Known Issues**:

- Slightly different error stack traces
- Enhanced Tracking Protection may affect external endpoints

**Configuration Recommendations**:

```
about:config settings (if needed):
- privacy.trackingprotection.enabled = false (for external endpoints)
- security.tls.insecure_fallback_hosts = [add your endpoint domain]
```

### Safari

**Versions**: 15+  
**Status**: ✅ Supported

**Features**:

- Basic error reporting works
- Privacy controls respected
- Reasonable performance

**Known Issues**:

- Stack traces may be less detailed
- Intelligent Tracking Prevention may block some endpoints
- HTTPS-only policy more restrictive

**Workarounds**:

- Ensure all endpoints use HTTPS
- Add endpoint domains to Safari's exception list if needed

### Edge

**Versions**: 100+  
**Status**: ✅ Full Support

**Features**:

- Chrome-equivalent functionality
- Windows integration features
- Good performance

**Known Issues**:

- Microsoft Defender SmartScreen may flag unknown endpoints

## Module Compatibility

### Core Enhancement Modules

#### Lib-Wrapper

**Status**: ✅ Compatible  
**Version**: Any  
**Notes**: Enhanced error attribution when Lib-Wrapper is present

#### SocketLib

**Status**: ✅ Compatible  
**Version**: Any  
**Notes**: No interaction, full compatibility

#### Settings Extender

**Status**: ✅ Compatible  
**Version**: Any  
**Notes**: May enhance settings UI appearance

### Popular UI Modules

#### Tidy5e Sheet

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: Sheet errors correctly attributed

#### Token Action HUD

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: No conflicts detected

#### Monk's Enhanced Journal

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: Full compatibility

### System Enhancement Modules

#### DnD5e Helpers

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: No known conflicts

#### PF2e Workbench

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: No known conflicts

#### SWADE Tools

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: Full compatibility

### Automation Modules

#### Midi-QOL

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: Complex automation errors properly attributed

#### Dynamic Active Effects (DAE)

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: No conflicts with effect processing

#### Advanced Macros

**Status**: ✅ Compatible  
**Version**: All tested versions  
**Notes**: Macro errors correctly attributed

### Known Incompatible Modules

#### None Currently Identified

All tested modules show compatibility. Report any conflicts via GitHub issues.

## System Compatibility

### Fully Tested Systems

#### D&D 5th Edition

**Status**: ✅ Full Support  
**Version**: All versions  
**Notes**: Complete integration, excellent error attribution

#### Pathfinder 2e

**Status**: ✅ Full Support  
**Version**: All versions  
**Notes**: Full compatibility with complex automation

#### SWADE

**Status**: ✅ Full Support  
**Version**: All versions  
**Notes**: No known issues

#### Call of Cthulhu 7e

**Status**: ✅ Full Support  
**Version**: All versions  
**Notes**: Full compatibility

### Partially Tested Systems

#### Cyberpunk RED

**Status**: ⚠️ Expected Compatible  
**Testing**: Limited  
**Notes**: Should work but not extensively tested

#### Vampire: The Masquerade 5e

**Status**: ⚠️ Expected Compatible  
**Testing**: Limited  
**Notes**: Basic functionality confirmed

### Universal Compatibility

#### Simple World Building

**Status**: ✅ Full Support  
**Notes**: Excellent for testing and development

#### Generic Systems

**Status**: ✅ Generally Compatible  
**Notes**: Should work with any system following FoundryVTT standards

## Common Issues and Solutions

### Issue: Module Not Loading

**Symptoms**:

- Module not appearing in settings
- No error messages in console
- Module listed but not functional

**Solutions**:

1. **Check FoundryVTT Version**

   ```javascript
   // Run in console to check version
   console.log(game.version);
   // Should be 12.0.0 or higher
   ```

2. **Verify Module Installation**

   - Check `Data/modules/errors-and-echoes/` exists
   - Verify `module.json` is present and valid
   - Ensure all files are properly extracted

3. **Clear Browser Cache**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear FoundryVTT cache in browser settings
   - Restart browser completely

### Issue: Error Reports Not Sending

**Symptoms**:

- Error occurred but no report sent
- Endpoint shows no received data
- Network tab shows no requests

**Diagnosis Steps**:

1. **Check Consent Status**

   ```javascript
   // Run in console
   game.modules.get('errors-and-echoes')?.api?.hasUserConsent();
   ```

2. **Verify Privacy Level**

   ```javascript
   // Check current privacy level
   game.settings.get('errors-and-echoes', 'privacyLevel');
   ```

3. **Test Endpoint Connectivity**
   - Use module settings to test endpoint
   - Check browser network tab for failed requests
   - Verify endpoint URL format

**Solutions**:

- Ensure error reporting is enabled in settings
- Check endpoint configuration
- Verify network connectivity
- Review browser console for CORS errors

### Issue: Incorrect Error Attribution

**Symptoms**:

- Errors attributed to wrong module
- All errors showing as "unknown"
- Core errors attributed to modules

**Solutions**:

1. **Check Module Load Order**

   - Ensure Errors and Echoes loads early
   - Check for module loading conflicts

2. **Verify Stack Trace Quality**

   ```javascript
   // Test error stack trace format
   try {
     throw new Error('test');
   } catch (e) {
     console.log(e.stack);
   }
   ```

3. **Update Browser**
   - Newer browsers provide better stack traces
   - Enable source maps if developing

### Issue: Performance Impact

**Symptoms**:

- FoundryVTT loading slowly
- UI lag during error handling
- High memory usage

**Solutions**:

1. **Adjust Privacy Level**

   - Lower privacy levels have less overhead
   - "Minimal" has lowest performance impact

2. **Check Error Frequency**

   - Excessive errors may indicate other issues
   - Review console for error patterns

3. **Monitor Resource Usage**
   ```javascript
   // Check memory usage
   performance.memory;
   ```

## Installation Troubleshooting

### Manual Installation Issues

**Problem**: ZIP extraction fails  
**Solution**:

- Download again (file may be corrupted)
- Use different extraction tool
- Check available disk space

**Problem**: Files in wrong location  
**Solution**:

- Verify path: `[FoundryVTT Data]/modules/errors-and-echoes/`
- Check that `module.json` is in root of module folder
- Ensure no nested folders

### Package Manager Issues

**Problem**: Module not found in package manager  
**Solution**:

- Wait for package indexing (can take time)
- Use manual installation with manifest URL
- Check spelling of module name

**Problem**: Installation stuck  
**Solution**:

- Cancel and retry installation
- Check internet connection
- Try manual installation

### Permission Issues

**Problem**: Cannot enable module  
**Solution**:

- Check user permissions in world
- Ensure GM or Assistant level access
- Verify world is not locked

## Performance Troubleshooting

### High Memory Usage

**Diagnosis**:

```javascript
// Check module memory usage
performance.measureUserAgentSpecificMemory?.();
```

**Solutions**:

- Lower privacy level to reduce data collection
- Check for memory leaks in other modules
- Restart FoundryVTT session periodically

### Slow Error Processing

**Diagnosis**:

- Monitor network tab for slow requests
- Check endpoint response times
- Profile JavaScript execution

**Solutions**:

- Use faster endpoint service
- Reduce error report frequency
- Optimize endpoint processing

### UI Freezing

**Symptoms**:

- Interface becomes unresponsive during errors
- Browser tab freezes temporarily

**Solutions**:

- Check for infinite error loops
- Disable problematic modules temporarily
- Update to latest browser version

## Privacy and Security Issues

### HTTPS Certificate Errors

**Problem**: Cannot connect to endpoint due to certificate issues  
**Solution**:

- Verify endpoint has valid SSL certificate
- Check certificate chain is complete
- Use endpoint with proper HTTPS setup

### CORS (Cross-Origin) Errors

**Problem**: Browser blocks requests to endpoint  
**Solution**:

- Configure endpoint with proper CORS headers
- Use sentry-relay for CORS handling
- Check endpoint documentation for CORS setup

### Data Privacy Concerns

**Problem**: Concerns about data being collected  
**Solution**:

- Review privacy settings and documentation
- Use "Minimal" privacy level
- Disable error reporting if necessary
- Review Privacy Policy for full details

## Advanced Troubleshooting

### Debug Mode Activation

**Enable Debug Logging**:

```javascript
// Enable debug mode (run in console)
CONFIG.debug.errors = true;
game.settings.set('errors-and-echoes', 'debugMode', true);
```

**Disable Debug Logging**:

```javascript
// Disable debug mode
CONFIG.debug.errors = false;
game.settings.set('errors-and-echoes', 'debugMode', false);
```

### Network Analysis

**Monitor All Network Traffic**:

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Clear existing entries
4. Trigger error condition
5. Look for requests to your endpoint
6. Check request/response details

**Common Network Issues**:

- **Status 0**: Network connectivity issue
- **Status 404**: Endpoint not found
- **Status 403**: Authentication/authorization issue
- **Status 500**: Server error at endpoint

### JavaScript Console Debugging

**Check Module Status**:

```javascript
// Verify module is loaded and active
game.modules.get('errors-and-echoes');

// Check API availability
game.modules.get('errors-and-echoes')?.api;

// Test error reporting manually
game.modules
  .get('errors-and-echoes')
  ?.api?.reportError(new Error('Manual test error'), { moduleId: 'test-module' });
```

**Monitor Error Events**:

```javascript
// Listen for all errors
window.addEventListener('error', event => {
  console.log('Error caught:', event.error);
});

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.log('Unhandled rejection:', event.reason);
});
```

### Module Conflict Detection

**Systematic Module Testing**:

1. Disable all modules except Errors and Echoes
2. Test basic functionality
3. Enable modules one by one
4. Test after each addition
5. Identify conflicting module

**Common Conflict Patterns**:

- Multiple error handling modules
- Modules that override global error handlers
- Modules with incompatible JavaScript frameworks

### File System Issues

**Check File Permissions**:

- Ensure FoundryVTT can read module files
- Verify data directory permissions
- Check for file locks or antivirus interference

**Verify File Integrity**:

```bash
# Check if all required files exist
ls -la [FoundryVTT Data]/modules/errors-and-echoes/
# Should include: module.json, module.js, errors-and-echoes.css
```

## Getting Additional Help

### Before Reporting Issues

1. **Test in Isolation**

   - Create minimal test world
   - Disable other modules
   - Reproduce issue

2. **Gather Information**

   - FoundryVTT version
   - Browser and version
   - Module version
   - Error messages and console logs
   - Steps to reproduce

3. **Check Existing Issues**
   - Review GitHub issues
   - Search for similar problems
   - Check documentation

### Reporting Issues

**Include This Information**:

- **Environment**: FoundryVTT version, browser, OS
- **Configuration**: Privacy level, endpoint setup, other modules
- **Steps**: How to reproduce the issue
- **Expected vs Actual**: What should happen vs what does happen
- **Logs**: Browser console errors, network requests
- **Privacy**: Confirm no PII in logs before sharing

### Support Channels

- **GitHub Issues**: Primary support channel
- **GitHub Discussions**: Questions and general discussion
- **Discord**: @rayners78 for urgent issues
- **Documentation**: This file and other docs for self-service

This troubleshooting guide should resolve most common issues with the Errors and Echoes module. If you encounter issues not covered here, please report them via GitHub Issues with full details.
