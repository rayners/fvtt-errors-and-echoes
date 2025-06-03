# Sentry-Relay Integration Guide

Complete guide for deploying your own error reporting endpoint using the Sentry-Relay reference implementation.

**Target Platform**: FoundryVTT v13+ | Cloudflare Workers | Sentry

## Overview

The Sentry-Relay is a reference implementation that demonstrates how to receive error reports from the Errors and Echoes module and forward them to monitoring services. This guide covers deployment, configuration, and customization of your own error reporting endpoint.

## Architecture

```
Foundry VTT → Errors and Echoes → Your Sentry-Relay → Sentry Project
```

**Key Benefits:**
- **Privacy Control**: You control where your module's error data goes
- **Custom Processing**: Add custom logic, filtering, or routing
- **Multiple Backends**: Forward to Sentry, Discord, email, databases, etc.
- **Author-based Routing**: Support multiple module authors with separate projects
- **Standard API**: Compatible with the Foundry VTT Error Reporting API v1.0

## Prerequisites

### Required Services
- **Cloudflare Account** with Workers enabled (free tier sufficient)
- **Sentry Account** with project(s) created (free tier sufficient)
- **Domain Name** (optional but recommended for professional setup)

### Development Tools
- **Node.js 18+** and npm
- **Wrangler CLI**: `npm install -g wrangler`
- **Git** for version control

### Knowledge Requirements
- Basic understanding of TypeScript/JavaScript
- Familiarity with Cloudflare Workers (optional)
- Basic understanding of HTTP APIs

## Quick Start Deployment

### 1. Get the Reference Implementation

```bash
# Option 1: Download from GitHub
git clone https://github.com/rayners/fvtt-errors-and-echoes.git
cd fvtt-errors-and-echoes/sentry-relay

# Option 2: Use the template (recommended)
npx create-cloudflare@latest my-error-relay \
  --template https://github.com/rayners/sentry-relay-template
cd my-error-relay
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Your Environment

Edit `wrangler.toml`:

```toml
name = "my-module-errors"
main = "src/index.ts"
compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "my-module-errors"
# Optional: Custom domain routing
routes = [
  { pattern = "errors.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[env.production.vars]
ALLOWED_ORIGINS = "https://yourdomain.com,http://localhost:30000"

[env.development]
name = "my-module-errors-dev"
```

### 4. Set Up Sentry Projects

Create separate Sentry projects for organization:

1. **Go to Sentry Dashboard** → Create New Project
2. **Choose Platform**: JavaScript
3. **Project Name**: `my-awesome-module-errors`
4. **Copy the DSN**: `https://key@org.ingest.sentry.io/project-id`

### 5. Configure Secrets

Set your Sentry DSNs as secrets:

```bash
# Set your Sentry DSN (replace with your actual DSN)
echo "https://your-key@your-org.ingest.sentry.io/your-project-id" | \
  npx wrangler secret put SENTRY_DSN_YOURUSERNAME --env production

# For development testing
echo "https://your-dev-key@your-org.ingest.sentry.io/dev-project-id" | \
  npx wrangler secret put SENTRY_DSN_YOURUSERNAME --env development
```

### 6. Deploy

```bash
# Deploy to production
npx wrangler deploy --env production

# The worker will be available at:
# https://my-module-errors.your-subdomain.workers.dev
```

### 7. Test Your Deployment

```bash
# Test health endpoint
curl https://my-module-errors.your-subdomain.workers.dev/health

# Test connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"test": true, "timestamp": "2024-12-07T03:47:00.000Z", "source": "manual-test"}' \
  https://my-module-errors.your-subdomain.workers.dev/test/yourusername
```

## Configuration Details

### Author-Based Routing

The relay routes errors based on the URL path parameter:

- `/report/yourusername` → Uses `SENTRY_DSN_YOURUSERNAME`
- `/report/collaborator` → Uses `SENTRY_DSN_COLLABORATOR`

**Adding New Authors:**

1. **Update the DSN mapping** in `src/index.ts`:

```typescript
function getSentryDSN(author: string, env: Env): string | undefined {
  const dsnMap: Record<string, keyof Env> = {
    'yourusername': 'SENTRY_DSN_YOURUSERNAME',
    'collaborator': 'SENTRY_DSN_COLLABORATOR',
    'community-dev': 'SENTRY_DSN_COMMUNITY_DEV',
  };

  const dsnKey = dsnMap[author];
  return dsnKey ? env[dsnKey] : undefined;
}
```

2. **Set the secret**:

```bash
echo "https://collab-key@org.ingest.sentry.io/collab-project" | \
  npx wrangler secret put SENTRY_DSN_COLLABORATOR --env production
```

3. **Deploy the update**:

```bash
npx wrangler deploy --env production
```

### Custom Domain Setup

For a professional setup, use a custom domain:

1. **Add your domain to Cloudflare**
2. **Update wrangler.toml**:

```toml
[env.production]
routes = [
  { pattern = "errors.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. **Deploy**:

```bash
npx wrangler deploy --env production
```

Your endpoints will be available at:
- `https://errors.yourdomain.com/report/yourusername`
- `https://errors.yourdomain.com/test/yourusername`
- `https://errors.yourdomain.com/health`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN_{AUTHOR}` | Sentry DSN for author's modules | `https://key@org.ingest.sentry.io/project` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://foundry.yourdomain.com,http://localhost:30000` |

### CORS Configuration

Configure CORS for your Foundry domains:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://foundry.yourdomain.com,https://backup.yourdomain.com,http://localhost:30000"
```

## Module Integration

### Configure Your Module

Once your relay is deployed, configure your Foundry module to use it:

```javascript
// In your module's init hook
Hooks.once('init', () => {
  const errorReporter = game.modules.get('errors-and-echoes');
  if (errorReporter?.active && errorReporter.api) {
    errorReporter.api.register({
      moduleId: 'my-awesome-module',
      endpoint: {
        name: 'My Module Error Reporting',
        url: 'https://errors.yourdomain.com/report/yourusername',
        author: 'yourusername',
        modules: ['my-awesome-module', 'my-other-module'],
        enabled: true
      },
      contextProvider: () => ({
        moduleVersion: game.modules.get('my-awesome-module')?.version,
        currentScene: canvas.scene?.name,
        // Add other useful debugging context
      })
    });
  }
});
```

### Test Integration

Test the complete integration from your module:

```javascript
// Test endpoint connectivity
const errorReporter = game.modules.get('errors-and-echoes');
if (errorReporter?.active) {
  const success = await window.ErrorsAndEchoes.ErrorReporter.testEndpoint(
    'https://errors.yourdomain.com/report/yourusername'
  );
  console.log('Endpoint test:', success ? 'PASSED' : 'FAILED');
}

// Generate a test error
try {
  throw new Error('Test error from my-awesome-module');
} catch (error) {
  errorReporter.api.report(error, {
    module: 'my-awesome-module',
    context: { test: true, source: 'manual-test' }
  });
}
```

## Customization Examples

### Custom Error Filtering

Add custom logic to filter or transform errors:

```typescript
async function handleErrorReport(request: Request, env: Env, path: string): Promise<Response> {
  // ... existing code ...

  try {
    const foundryReport: FoundryErrorReport = await request.json();
    
    // Custom filtering logic
    if (shouldIgnoreError(foundryReport)) {
      return createStandardResponse(true, {
        message: 'Error filtered out - no action needed'
      });
    }
    
    // Custom error enhancement
    const enhancedReport = enhanceErrorReport(foundryReport);
    
    // Convert to Sentry format
    const sentryEvent = transformToSentryEvent(enhancedReport);
    
    // ... rest of handling ...
  } catch (error) {
    // ... error handling ...
  }
}

function shouldIgnoreError(report: FoundryErrorReport): boolean {
  // Ignore known harmless errors
  const ignoredMessages = [
    'Network request timeout',
    'User cancelled operation',
    'Permission denied by user'
  ];
  
  return ignoredMessages.some(msg => 
    report.error.message.includes(msg)
  );
}

function enhanceErrorReport(report: FoundryErrorReport): FoundryErrorReport {
  // Add custom tags or context
  const enhanced = { ...report };
  
  // Add environment detection
  if (report.foundry.version.includes('beta')) {
    enhanced.moduleContext = {
      ...enhanced.moduleContext,
      environment: 'beta',
      warning: 'Beta version - errors expected'
    };
  }
  
  return enhanced;
}
```

### Multiple Backend Support

Forward errors to multiple services:

```typescript
async function handleErrorReport(request: Request, env: Env, path: string): Promise<Response> {
  // ... existing validation code ...

  const foundryReport: FoundryErrorReport = await request.json();
  const results: Array<{ service: string; success: boolean; eventId?: string }> = [];

  // Send to Sentry
  try {
    const sentryEvent = transformToSentryEvent(foundryReport);
    const sentryEventId = await sendToSentry(sentryEvent, sentryDSN);
    results.push({ 
      service: 'sentry', 
      success: !!sentryEventId, 
      eventId: sentryEventId || undefined 
    });
  } catch (error) {
    results.push({ service: 'sentry', success: false });
  }

  // Send to Discord (if configured)
  if (env.DISCORD_WEBHOOK_URL) {
    try {
      const discordEventId = await sendToDiscord(foundryReport, env.DISCORD_WEBHOOK_URL);
      results.push({ 
        service: 'discord', 
        success: !!discordEventId, 
        eventId: discordEventId 
      });
    } catch (error) {
      results.push({ service: 'discord', success: false });
    }
  }

  // Return combined results
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    return createStandardResponse(true, {
      eventId: successful[0].eventId,
      message: `Error reported to ${successful.length} service(s): ${successful.map(r => r.service).join(', ')}`
    });
  } else {
    return createStandardResponse(false, {
      message: 'Failed to report error to any configured service',
      status: 502
    });
  }
}

async function sendToDiscord(report: FoundryErrorReport, webhookUrl: string): Promise<string | null> {
  const embed = {
    title: `🚨 Error in ${report.attribution.moduleId}`,
    description: report.error.message,
    color: 0xff0000,
    timestamp: report.meta.timestamp,
    fields: [
      {
        name: 'Foundry Version',
        value: report.foundry.version,
        inline: true
      },
      {
        name: 'Confidence',
        value: report.attribution.confidence,
        inline: true
      }
    ]
  };

  if (report.error.stack) {
    embed.fields.push({
      name: 'Stack Trace',
      value: `\`\`\`\n${report.error.stack.substring(0, 1000)}\n\`\`\``,
      inline: false
    });
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });

  return response.ok ? crypto.randomUUID() : null;
}
```

### Database Storage

Store errors in a database for analysis:

```typescript
// Add to your environment interface
export interface Env {
  // ... existing properties ...
  DB?: D1Database; // Cloudflare D1 database
}

async function storeInDatabase(report: FoundryErrorReport, env: Env): Promise<string | null> {
  if (!env.DB) return null;

  const eventId = crypto.randomUUID();
  
  try {
    await env.DB.prepare(`
      INSERT INTO error_reports (
        id, module_id, error_message, error_stack, error_type,
        foundry_version, attribution_confidence, attribution_method,
        privacy_level, timestamp, raw_report
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId,
      report.attribution.moduleId,
      report.error.message,
      report.error.stack,
      report.error.type,
      report.foundry.version,
      report.attribution.confidence,
      report.attribution.method,
      report.meta.privacyLevel,
      report.meta.timestamp,
      JSON.stringify(report)
    ).run();

    return eventId;
  } catch (error) {
    console.error('Database storage failed:', error);
    return null;
  }
}

// Database schema (SQL)
const schema = `
CREATE TABLE IF NOT EXISTS error_reports (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT,
  foundry_version TEXT,
  attribution_confidence TEXT,
  attribution_method TEXT,
  privacy_level TEXT,
  timestamp TEXT,
  raw_report TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_module_id ON error_reports(module_id);
CREATE INDEX idx_timestamp ON error_reports(timestamp);
CREATE INDEX idx_created_at ON error_reports(created_at);
`;
```

## Advanced Configuration

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimiter = new Map<string, RateLimitEntry>();

function checkRateLimit(
  clientKey: string, 
  limit: number = 100, 
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimiter.get(clientKey);

  if (!entry || now > entry.resetTime) {
    // New window or expired
    rateLimiter.set(clientKey, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  entry.count++;
  rateLimiter.set(clientKey, entry);
  return { allowed: true };
}

// Usage in handleErrorReport
async function handleErrorReport(request: Request, env: Env, path: string): Promise<Response> {
  // Rate limiting by IP + Author
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const author = path.split('/')[2];
  const rateLimitKey = `${clientIP}:${author}`;
  
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return createStandardResponse(false, {
      message: 'Rate limit exceeded',
      retryAfter: rateLimit.retryAfter,
      status: 429
    });
  }

  // ... rest of error handling ...
}
```

### Monitoring and Alerting

Add monitoring for your relay service:

```typescript
// Add metrics collection
interface Metrics {
  totalRequests: number;
  successfulReports: number;
  failedReports: number;
  lastRequestTime: string;
}

let metrics: Metrics = {
  totalRequests: 0,
  successfulReports: 0,
  failedReports: 0,
  lastRequestTime: new Date().toISOString()
};

function updateMetrics(success: boolean) {
  metrics.totalRequests++;
  metrics.lastRequestTime = new Date().toISOString();
  
  if (success) {
    metrics.successfulReports++;
  } else {
    metrics.failedReports++;
  }
}

// Add metrics endpoint
async function handleMetrics(): Promise<Response> {
  return new Response(JSON.stringify({
    ...metrics,
    uptime: Date.now() - startTime,
    successRate: metrics.totalRequests > 0 
      ? (metrics.successfulReports / metrics.totalRequests * 100).toFixed(2) + '%'
      : '0%'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Check your ALLOWED_ORIGINS setting
npx wrangler secret list --env production

# Update if needed
npx wrangler secret put ALLOWED_ORIGINS --env production
# Enter: https://foundry.yourdomain.com,http://localhost:30000
```

**2. Sentry Connection Fails**
```bash
# Test your Sentry DSN manually
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Sentry-Auth: Sentry sentry_version=7, sentry_key=YOUR_KEY, sentry_client=test/1.0.0" \
  -d '{"event_id":"test","timestamp":"2024-12-07T00:00:00","platform":"javascript","sdk":{"name":"test","version":"1.0.0"}}' \
  https://YOUR_ORG.ingest.sentry.io/api/YOUR_PROJECT_ID/store/
```

**3. Deployment Issues**
```bash
# Check worker logs
npx wrangler tail --env production

# Validate configuration
npx wrangler dev --env development
```

### Debug Mode

Add debug logging for troubleshooting:

```typescript
function debugLog(message: string, data?: any) {
  if (env.DEBUG === 'true') {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Usage
debugLog('Received error report', foundryReport);
debugLog('Transformed to Sentry event', sentryEvent);
debugLog('Sentry response', { eventId, success: !!eventId });
```

Enable debug mode:
```bash
npx wrangler secret put DEBUG --env development
# Enter: true
```

## Security Best Practices

### Input Validation

Always validate incoming data:

```typescript
function validateErrorReport(report: any): report is FoundryErrorReport {
  return !!(
    report &&
    typeof report === 'object' &&
    report.error?.message &&
    report.attribution?.moduleId &&
    report.meta?.timestamp
  );
}

// Usage
if (!validateErrorReport(foundryReport)) {
  return createStandardResponse(false, {
    message: 'Invalid error report format',
    status: 400
  });
}
```

### Sanitization

Remove sensitive information:

```typescript
function sanitizeReport(report: FoundryErrorReport): FoundryErrorReport {
  const sanitized = JSON.parse(JSON.stringify(report)); // Deep clone

  // Remove potential file paths
  if (sanitized.error.stack) {
    sanitized.error.stack = sanitized.error.stack
      .replace(/\/Users\/[^\/\s]+/g, '/Users/***')
      .replace(/C:\\Users\\[^\\s]+/g, 'C:\\Users\\***')
      .replace(/\/home\/[^\/\s]+/g, '/home/***');
  }

  // Remove sensitive module context
  if (sanitized.moduleContext) {
    delete sanitized.moduleContext.userToken;
    delete sanitized.moduleContext.apiKey;
    delete sanitized.moduleContext.password;
  }

  return sanitized;
}
```

### Environment Security

Protect your secrets:

```bash
# Use separate environments
npx wrangler secret put SENTRY_DSN_YOURUSERNAME --env production
npx wrangler secret put SENTRY_DSN_YOURUSERNAME --env development

# Never commit secrets to version control
echo "*.env" >> .gitignore
echo ".dev.vars" >> .gitignore
```

## Maintenance

### Regular Tasks

1. **Monitor Error Rates**: Check Sentry dashboards regularly
2. **Update Dependencies**: Keep Wrangler and dependencies up to date
3. **Review Logs**: Check Cloudflare Worker logs for issues
4. **Backup Configuration**: Keep your `wrangler.toml` in version control

### Updates and Migrations

```bash
# Update dependencies
npm update

# Deploy updates
npx wrangler deploy --env production

# Check deployment
curl https://errors.yourdomain.com/health
```

### Scaling Considerations

- **Cloudflare Workers** have generous free tiers and auto-scale
- **Sentry** free tier includes 5,000 errors/month per project
- **Rate limiting** prevents abuse and controls costs
- **Multiple environments** help separate dev/prod traffic

## Conclusion

The Sentry-Relay integration provides a robust, scalable solution for collecting error reports from your Foundry VTT modules. With this setup, you'll have:

✅ **Professional Error Monitoring**: Centralized error tracking with Sentry  
✅ **Privacy Control**: You control where your data goes  
✅ **Custom Processing**: Filter, enhance, or route errors as needed  
✅ **Multiple Backends**: Support for Sentry, Discord, email, databases  
✅ **Scalable Infrastructure**: Cloudflare Workers auto-scale globally  
✅ **Standard API**: Compatible with Foundry VTT Error Reporting API  

For questions or issues with the integration, check the troubleshooting section above or create an issue on the [Errors and Echoes GitHub repository](https://github.com/rayners/fvtt-errors-and-echoes).