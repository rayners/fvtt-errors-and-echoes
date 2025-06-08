# Errors and Echoes Integration Examples

This directory contains working examples of how to integrate the Errors and Echoes Registration API with various types of FoundryVTT modules.

## Available Examples

### 1. `journeys-and-jamborees.js`
**Type**: Complex gameplay module  
**Features**: Party management, travel system, scene integration  
**Demonstrates**:
- Rich context provider with party and travel state
- Intelligent error filtering for module-specific errors
- Custom endpoint configuration
- Manual error reporting for specific scenarios
- Hook integration for automatic monitoring

### 2. `simple-weather.js`
**Type**: Weather/environmental effects module  
**Features**: Weather generation, visual effects, calendar integration  
**Demonstrates**:
- Weather state context provider
- Calendar integration error handling
- Visual effects error filtering
- Scene-specific weather data context
- Audio/visual module error filtering

### 3. `generic-module.js`
**Type**: Template for any module  
**Features**: Complete integration template with documentation  
**Demonstrates**:
- All Registration API features
- Comprehensive code comments
- Best practices checklist
- Privacy considerations
- Integration patterns

## Quick Start

1. **Choose the appropriate example** for your module type
2. **Copy the relevant file** to your module's source directory
3. **Customize the integration**:
   - Replace module ID with your actual module ID
   - Update context provider for your module's state
   - Customize error filter for your module's scope
   - Configure endpoint (or remove to use global settings)
4. **Test the integration** in development
5. **Deploy with your module**

## Integration Patterns

### Basic Registration
```javascript
// Minimal registration - just register the module
window.ErrorsAndEchoesAPI.register({
  moduleId: 'your-module-id'
});
```

### Context Provider
```javascript
// Add debugging context to error reports
window.ErrorsAndEchoesAPI.register({
  moduleId: 'your-module-id',
  contextProvider: () => ({
    moduleState: getCurrentState(),
    activeFeatures: getActiveFeatures(),
    userConfiguration: getRelevantSettings()
  })
});
```

### Error Filtering
```javascript
// Focus on relevant errors only
window.ErrorsAndEchoesAPI.register({
  moduleId: 'your-module-id',
  errorFilter: (error) => {
    // Return true to filter OUT (not report)
    // Return false to report the error
    return !error.stack.includes('your-module-id');
  }
});
```

### Manual Reporting
```javascript
// Report specific errors with additional context
try {
  performRiskyOperation();
} catch (error) {
  window.ErrorsAndEchoesAPI.report(error, {
    context: {
      operation: 'performRiskyOperation',
      userInput: sanitizedInput,
      timestamp: new Date().toISOString()
    }
  });
}
```

## Best Practices

### Context Providers
- **Keep data minimal**: Only include debugging-relevant information
- **Protect privacy**: Never include user content or personal data
- **Handle errors**: Wrap context gathering in try-catch blocks
- **Be consistent**: Use standard field names across your module

### Error Filtering
- **Start permissive**: Begin by reporting all errors, then refine
- **Focus on relevance**: Filter out clearly unrelated errors
- **Test thoroughly**: Ensure important errors aren't filtered out
- **Document decisions**: Comment why specific filters exist

### Manual Reporting
- **Critical paths**: Add manual reporting to important error-prone functions
- **Rich context**: Include operation-specific debugging information
- **User feedback**: Combine with user notifications when appropriate
- **Error boundaries**: Use in top-level error handlers

### Privacy Considerations
- **Anonymous by design**: Never include user-identifying information
- **Minimal data**: Only collect what's needed for debugging
- **User control**: Respect user privacy settings
- **Transparent**: Document what data is collected

## Module Types

### Gameplay Modules
Examples: Party managers, travel systems, custom mechanics
- Focus on game state context
- Filter for gameplay-related errors
- Include rule system information

### UI/UX Modules  
Examples: HUDs, custom interfaces, visual enhancements
- Include viewport and rendering context
- Filter for UI framework errors
- Track user interaction state

### Integration Modules
Examples: Calendar systems, external API connectors
- Include integration status context
- Filter for third-party service errors  
- Track synchronization state

### Utility Modules
Examples: Developer tools, automation scripts
- Include tool state context
- Filter for utility-specific errors
- Track operation history

## Testing Your Integration

1. **Development Testing**:
   ```javascript
   // Force an error to test reporting
   console.log('Testing error reporting...');
   throw new Error('Test error from your-module-id');
   ```

2. **Context Validation**:
   - Check that context provider returns expected data
   - Verify no sensitive information is included
   - Test error handling in context provider

3. **Filter Validation**:
   - Ensure relevant errors are not filtered out
   - Verify unrelated errors are properly filtered
   - Test edge cases and boundary conditions

4. **Integration Testing**:
   - Test with Errors and Echoes disabled
   - Test with different privacy levels
   - Test manual reporting functions

## Troubleshooting

### Common Issues

**Registration not working**:
- Check that Errors and Echoes is installed and enabled
- Verify module ID matches your module.json
- Ensure registration happens after 'ready' hook

**Context provider errors**:
- Wrap context gathering in try-catch blocks
- Return empty object `{}` on errors
- Avoid accessing undefined properties

**Filter too aggressive**:
- Start with no filter and add restrictions gradually
- Log filtered errors during development
- Test with various error scenarios

**Privacy concerns**:
- Review context data for sensitive information
- Test with different privacy levels
- Document data collection in your module

## Support

For questions about integration:
1. Check the [API Reference](../API-REFERENCE.md)
2. Review the [main README](../README.md) for technical details
3. Open an issue on the Errors and Echoes repository
4. Join the community discussion forums

## Contributing

To contribute additional examples:
1. Create a new example file following the naming pattern
2. Include comprehensive comments and documentation
3. Test the example thoroughly
4. Submit a pull request with the example and updated README