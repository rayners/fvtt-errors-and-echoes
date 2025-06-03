# Community FAQ and Support

This document addresses frequently asked questions, provides support resources, and outlines community guidelines for the Errors and Echoes module.

## Table of Contents

- [Frequently Asked Questions](#frequently-asked-questions)
- [Privacy and Data Collection](#privacy-and-data-collection)
- [Technical Questions](#technical-questions)
- [Module Integration](#module-integration)
- [Troubleshooting FAQ](#troubleshooting-faq)
- [Support Channels](#support-channels)
- [Community Guidelines](#community-guidelines)
- [Contributing to the Community](#contributing-to-the-community)

## Frequently Asked Questions

### General Questions

**Q: What is Errors and Echoes?**  
A: Errors and Echoes is a privacy-first error reporting module for FoundryVTT that helps module authors identify and fix issues in their modules. It anonymously collects error information and sends it to module authors' configured endpoints, helping improve the overall quality of the FoundryVTT ecosystem.

**Q: Why should I install this module?**  
A: By installing Errors and Echoes, you help module authors improve their code by providing anonymous error reports. This leads to:
- Better, more stable modules
- Faster bug fixes
- Improved user experience across the FoundryVTT community
- Early detection of compatibility issues

**Q: Is this module required by other modules?**  
A: No, Errors and Echoes is always optional. Modules should gracefully handle its absence and continue working normally without error reporting functionality.

**Q: Will this slow down my FoundryVTT?**  
A: No, Errors and Echoes is designed for minimal performance impact:
- <100ms additional startup time
- <5ms processing per error
- <1MB memory usage
- No impact on normal gameplay

**Q: Can I see what data is being sent?**  
A: Yes! The Privacy Details dialog shows exactly what data is collected at each privacy level. You can also monitor network requests in your browser's developer tools to see the actual data being transmitted.

## Privacy and Data Collection

### Privacy Concerns

**Q: What personal information is collected?**  
A: **None.** Errors and Echoes is designed to be anonymous-by-design:
- No usernames, email addresses, or account information
- No IP address logging (depends on endpoint configuration)
- No unique user identifiers or tracking
- No personally identifiable information of any kind

**Q: What data IS collected?**  
A: This depends on your privacy level setting:

**Minimal Level:**
- Error message only
- Nothing else

**Standard Level:**
- Error message
- FoundryVTT version
- List of active module names (no versions)

**Detailed Level:**
- Everything from Standard
- Active module versions
- Browser type and version (no unique identifiers)
- Scene name and ID (no content)
- Error stack trace (with file paths sanitized)

**Q: Can module authors identify me personally?**  
A: No. The system is specifically designed to prevent this:
- No unique identifiers are transmitted
- No session tracking across reports
- No correlation between different error reports
- All potentially identifying information is stripped

**Q: What if I don't trust the privacy claims?**  
A: You can verify them yourself:
- Review the open-source code
- Monitor network traffic in browser developer tools
- Use the most restrictive "Minimal" privacy level
- Disable error reporting entirely if preferred

**Q: Is this GDPR compliant?**  
A: Yes, Errors and Echoes is designed for GDPR compliance:
- Anonymous data collection falls outside GDPR scope
- No personal data is processed
- Users have full control over participation
- Clear transparency about data collection practices

### Data Usage and Retention

**Q: How long is my data kept?**  
A: This depends on the endpoint configuration chosen by each module author. Common patterns:
- **Temporary storage**: 30-90 days for active debugging
- **Aggregated statistics**: Indefinitely in anonymous form
- **Individual reports**: Usually deleted after issue resolution

**Q: Who has access to my error reports?**  
A: Only the module authors you've specifically configured endpoints for. Reports are sent directly to author-controlled endpoints, not to a central database.

**Q: Can I delete my data?**  
A: Since no personal identifiers are collected, there's no way to identify which reports came from you. However, you can:
- Disable error reporting to stop future data collection
- Clear your local settings to reset all preferences
- Contact module authors directly about their data retention

### Control and Consent

**Q: How do I opt out of error reporting?**  
A: You have several options:
1. **Complete opt-out**: Disable error reporting in module settings
2. **Selective opt-out**: Remove endpoint configurations for specific modules
3. **Minimal data**: Use "Minimal" privacy level
4. **Temporary opt-out**: Disable during specific sessions

**Q: Will opting out affect module functionality?**  
A: No, modules should work exactly the same whether error reporting is enabled or disabled. Error reporting is purely for improvement purposes.

**Q: Can I change my privacy settings later?**  
A: Yes, you can change your privacy level and consent settings at any time in the module configuration. Changes take effect immediately.

## Technical Questions

### Module Functionality

**Q: How does error attribution work?**  
A: Errors and Echoes uses several techniques to determine which module caused an error:
- **Stack trace analysis**: Examining file paths in error stack traces
- **Context detection**: Looking at what code was executing when the error occurred
- **Confidence scoring**: Rating how certain the attribution is (0-1 scale)
- **Fallback handling**: Marking uncertain attributions as "unknown"

**Q: What types of errors are reported?**  
A: All JavaScript errors that occur in FoundryVTT:
- Unhandled exceptions
- Promise rejections
- Runtime errors
- Type errors
- Reference errors
- Custom thrown errors

**Q: How accurate is module attribution?**  
A: Attribution accuracy varies by scenario:
- **High confidence (>0.8)**: Errors clearly from specific module code
- **Medium confidence (0.5-0.8)**: Likely from specific module with some uncertainty
- **Low confidence (<0.5)**: Could be from multiple sources, marked as "unknown"

**Q: What happens if no endpoints are configured?**  
A: Nothing. The module simply logs errors locally without transmitting them anywhere. No network requests are made.

### Integration and Compatibility

**Q: Will this work with [specific module]?**  
A: Errors and Echoes is designed for universal compatibility and has been tested with popular modules. See [FOUNDRY-COMPATIBILITY.md](FOUNDRY-COMPATIBILITY.md) for detailed compatibility information.

**Q: I'm a module developer. How do I integrate this?**  
A: See the [Developer Guide](README.md) and [API Reference](API-REFERENCE.md) for complete integration instructions. Basic integration takes under 30 minutes.

**Q: Does this work with custom game systems?**  
A: Yes, Errors and Echoes works with any FoundryVTT game system. It operates at the core JavaScript level, independent of specific game system implementations.

## Module Integration

### For Module Authors

**Q: Should I require users to install Errors and Echoes?**  
A: No, never require it. Always implement graceful degradation:
```javascript
// Good: Optional integration
const errorReporter = game.modules.get('errors-and-echoes')?.api;
if (errorReporter) {
  // Error reporting available
} else {
  // Continue normally without error reporting
}
```

**Q: How do I set up error reporting for my module?**  
A: Follow these steps:
1. Set up an endpoint (see [Sentry-Relay Integration Guide](SENTRY-RELAY-INTEGRATION.md))
2. Add endpoint configuration to your module
3. Optionally integrate the API for custom error reporting
4. Document the integration for your users

**Q: What endpoint should I use?**  
A: Common options:
- **Sentry**: Professional error tracking service
- **Discord Webhooks**: Simple integration for small projects
- **Custom Server**: Full control over data handling
- **Sentry-Relay**: Open-source proxy for custom processing

**Q: How do I handle user privacy concerns?**  
A: Be transparent about error reporting:
- Document that your module uses Errors and Echoes
- Explain what data you collect and how you use it
- Provide opt-out instructions
- Respect user privacy choices

### For Users

**Q: How do I know if a module uses error reporting?**  
A: Check the module's documentation or settings. Responsible module authors will clearly document error reporting integration and provide opt-out instructions.

**Q: Can I disable error reporting for specific modules?**  
A: Yes, you can remove endpoint configurations for specific modules in the Errors and Echoes settings, effectively disabling reporting for those modules only.

**Q: What if I don't want ANY error reporting?**  
A: Simply disable error reporting in the Errors and Echoes settings. This will prevent all error reports regardless of module configurations.

## Troubleshooting FAQ

### Common Issues

**Q: The module isn't loading. What should I check?**  
A: Common solutions:
1. Verify FoundryVTT version is 12.0.0 or higher
2. Check that all module files are properly installed
3. Clear browser cache and restart FoundryVTT
4. Check browser console for error messages

**Q: Errors aren't being reported. Why not?**  
A: Check these common causes:
1. Error reporting is disabled in settings
2. No endpoints are configured
3. Privacy level is set too low for the type of error
4. Network connectivity issues
5. CORS or HTTPS certificate problems

**Q: I'm getting CORS errors. How do I fix this?**  
A: CORS errors occur when browsers block cross-origin requests:
1. Ensure your endpoint supports CORS
2. Use HTTPS for all endpoints
3. Consider using sentry-relay for CORS handling
4. Check endpoint documentation for CORS setup

**Q: The settings page won't open. What's wrong?**  
A: Try these solutions:
1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
2. Check browser console for JavaScript errors
3. Disable other modules temporarily to check for conflicts
4. Try a different browser

### Performance Issues

**Q: FoundryVTT is running slowly after installing this module. Why?**  
A: While Errors and Echoes is designed for minimal impact, performance issues can occur:
1. Check if you have excessive errors from other modules
2. Lower the privacy level to reduce processing overhead
3. Temporarily disable error reporting to confirm the cause
4. Check for conflicts with other modules

**Q: How can I minimize performance impact?**  
A: Use these strategies:
- Set privacy level to "Minimal" for lowest overhead
- Regularly update modules to reduce error frequency
- Monitor browser console for excessive error patterns
- Use efficient endpoints that respond quickly

### Error Attribution Issues

**Q: Errors are being attributed to the wrong module. How do I fix this?**  
A: Attribution can be challenging in complex scenarios:
1. This is often expected behavior for edge cases
2. Check if multiple modules interact in the error scenario
3. Look for confidence scores in error reports
4. Consider that some errors may legitimately be "unknown"

**Q: All my errors show as "unknown source." Why?**  
A: Common causes:
1. Errors from browser extensions or external scripts
2. Minified code without source maps
3. Very generic errors without clear stack traces
4. Errors from core FoundryVTT code

## Support Channels

### Primary Support

**GitHub Issues** (Recommended)
- **URL**: https://github.com/rayners/fvtt-errors-and-echoes/issues
- **Best for**: Bug reports, feature requests, technical issues
- **Response time**: Usually within 24-48 hours
- **Requirements**: GitHub account

**GitHub Discussions**
- **URL**: https://github.com/rayners/fvtt-errors-and-echoes/discussions
- **Best for**: Questions, general discussion, sharing experiences
- **Response time**: Community-driven, variable
- **Requirements**: GitHub account

### Secondary Support

**Discord**
- **Contact**: @rayners78
- **Best for**: Urgent security issues, real-time troubleshooting
- **Response time**: Variable, best effort
- **Note**: For urgent issues only, prefer GitHub for tracking

**FoundryVTT Community**
- **Discord**: #module-development channel
- **Reddit**: r/FoundryVTT
- **Best for**: General FoundryVTT questions, community discussion

### Self-Service Resources

**Documentation**
- [User Guide](README_FOUNDRY.md) - Complete user instructions
- [Developer Guide](README.md) - Integration and development
- [API Reference](API-REFERENCE.md) - Complete API documentation
- [Compatibility Guide](FOUNDRY-COMPATIBILITY.md) - Troubleshooting and compatibility
- [Testing Guide](TESTING.md) - Validation procedures

## Community Guidelines

### Code of Conduct

**Be Respectful**
- Treat all community members with respect and courtesy
- Avoid personal attacks, harassment, or discriminatory language
- Focus on constructive feedback and solutions

**Be Helpful**
- Share knowledge and experiences with others
- Provide clear, detailed information when reporting issues
- Help newcomers understand the module and privacy concepts

**Be Privacy-Conscious**
- Never share personally identifiable information in issues or discussions
- Respect others' privacy concerns and choices
- Sanitize logs and error reports before sharing

### Issue Reporting Guidelines

**Before Reporting**
1. Search existing issues to avoid duplicates
2. Test in isolation to confirm the issue
3. Gather all relevant information (versions, browsers, steps to reproduce)
4. Check documentation for known solutions

**When Reporting**
- Use clear, descriptive titles
- Provide complete environment information
- Include steps to reproduce the issue
- Sanitize any logs or error messages
- Be patient and respectful in all interactions

**Security Issues**
- **DO NOT** report security vulnerabilities in public issues
- Follow the [Security Policy](SECURITY.md) for responsible disclosure
- Contact @rayners78 directly for urgent security matters

### Discussion Guidelines

**Technical Discussions**
- Stay on topic and relevant to Errors and Echoes
- Provide context and background for your questions
- Share solutions and workarounds that helped you
- Use appropriate technical language while remaining accessible

**Privacy Discussions**
- Respect different comfort levels with data sharing
- Provide factual information about privacy implications
- Avoid fear-mongering or exaggerated claims
- Support users in making informed decisions

## Contributing to the Community

### Ways to Help

**For Users**
- Report bugs and provide detailed feedback
- Help answer questions in discussions
- Share your experiences and use cases
- Test new releases and provide feedback

**For Developers**
- Contribute code improvements via pull requests
- Add or improve documentation
- Help with testing across different environments
- Share integration examples and best practices

**For Module Authors**
- Integrate Errors and Echoes responsibly
- Document your integration clearly
- Respect user privacy choices
- Share endpoint configuration examples

### Recognition

**Contributors**
All contributors are recognized in:
- CHANGELOG.md for their specific contributions
- GitHub contributor statistics
- Community discussions and documentation

**Community Members**
Active community members who help others are highlighted in:
- GitHub Discussions
- Community documentation
- Annual community recognition

### Translation and Localization

**Current Status**
- English: Complete
- Other languages: Community contributions welcome

**How to Contribute Translations**
1. Check existing language files in `languages/`
2. Create new language file based on `en.json`
3. Translate all strings while maintaining technical accuracy
4. Submit via pull request with testing notes
5. Maintain translations for future updates

**Translation Guidelines**
- Preserve technical terms and concepts
- Maintain privacy terminology accuracy
- Consider cultural privacy expectations
- Test translations in actual FoundryVTT environment

Thank you for being part of the Errors and Echoes community! Your participation helps make FoundryVTT module development better for everyone while respecting user privacy and choice.