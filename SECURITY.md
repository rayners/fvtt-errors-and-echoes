# Security Policy

## Supported Versions

We take security seriously and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Errors and Echoes, please report it responsibly by following these guidelines:

### Where to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues directly to:

- **Email**: security@rayners.dev
- **Subject Line**: `[SECURITY] Errors and Echoes - [Brief Description]`

### What to Include

Please include the following information in your security report:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and affected functionality
3. **Reproduction Steps**: Step-by-step instructions to reproduce the issue
4. **Environment**: Foundry VTT version, browser, and module configuration
5. **Suggested Fix**: If you have ideas for how to fix the issue

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: Within 5 business days, we will provide an initial assessment
- **Resolution**: Security issues will be prioritized and resolved as quickly as possible
- **Disclosure**: We will coordinate with you on public disclosure timing

### Security Best Practices for Users

To use Errors and Echoes securely:

#### Privacy Configuration

- **Review Privacy Levels**: Understand what data each privacy level collects
- **Use Minimal Levels**: Start with "Minimal" privacy level and only increase if needed
- **Verify Endpoints**: Only configure trusted author endpoints

#### Network Security

- **HTTPS Only**: Ensure all configured endpoints use HTTPS
- **Verify Certificates**: Check that author endpoints have valid SSL certificates
- **Network Monitoring**: Monitor network traffic if you have security concerns

#### Module Configuration

- **Regular Updates**: Keep the module updated to the latest version
- **Review Settings**: Periodically review your privacy and endpoint settings
- **Test Configuration**: Use the built-in test functionality to verify connections

### Threat Model

Errors and Echoes is designed with the following security considerations:

#### Data Protection

- **No PII Collection**: The module never collects personally identifiable information
- **Configurable Privacy**: Users control what data is shared through privacy levels
- **Local Processing**: Error attribution and filtering happens locally

#### Network Security

- **TLS Required**: All external communications require HTTPS
- **No Default Endpoints**: Users must explicitly configure author endpoints
- **Timeout Protection**: Network requests have reasonable timeouts

#### Browser Security

- **Content Security Policy**: Compatible with Foundry's CSP restrictions
- **Same-Origin Policy**: Respects browser security boundaries
- **Storage Isolation**: Settings stored in Foundry's secure module storage

### Known Security Limitations

#### Endpoint Trust

- **User Responsibility**: Users must verify the trustworthiness of configured endpoints
- **No Certificate Pinning**: The module relies on browser certificate validation
- **Data Transmission**: Error data is transmitted to configured endpoints

#### Error Content

- **Module Code Exposure**: Error reports may contain fragments of module code
- **System Information**: Higher privacy levels include browser and system details
- **Scene Context**: "Detailed" level may include scene names and limited context

### Security Updates

When security issues are resolved:

1. **Patch Release**: Security fixes are released as patch versions
2. **Security Advisory**: GitHub security advisory will be published
3. **User Notification**: Critical security updates will be announced
4. **Migration Guide**: If configuration changes are needed, we provide clear guidance

### Contact Information

For security-related questions or concerns:

- **Security Email**: security@rayners.dev
- **General Issues**: [GitHub Issues](https://github.com/rayners/fvtt-errors-and-echoes/issues) (for non-security bugs)
- **Discord**: rayners78 (for general questions)

---

**Last Updated**: December 2024
**Next Review**: March 2025
