/**
 * Error Reporter System
 * 
 * Handles the actual sending of error reports to configured endpoints.
 * Includes rate limiting, deduplication, and payload formatting.
 */
export class ErrorReporter {
  static recentReports = new Map(); // For deduplication
  static maxReportsPerHour = 50; // Rate limiting
  static maxPayloadSize = 50000; // 50KB limit

  /**
   * Send an error report to the configured endpoint
   */
  static async sendReport(error, attribution, endpoint, context = {}) {
    // Check rate limiting and deduplication
    if (!this.shouldSendReport(error, attribution)) {
      return;
    }

    // Check endpoint consent
    if (!window.ErrorsAndEchoes?.ConsentManager?.hasEndpointConsent(endpoint.url)) {
      return;
    }

    try {
      const payload = this.buildPayload(error, attribution, context);
      
      // Validate payload size
      if (JSON.stringify(payload).length > this.maxPayloadSize) {
        console.warn('Errors and Echoes: Payload too large, skipping report');
        return;
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foundry-Version': game.version,
          'X-Module-Version': game.modules.get('errors-and-echoes')?.version || 'unknown',
          'X-Privacy-Level': window.ErrorsAndEchoes?.ConsentManager?.getPrivacyLevel() || 'standard',
          'User-Agent': `FoundryVTT-ErrorsAndEchoes/${game.modules.get('errors-and-echoes')?.version || 'unknown'}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Track successful report
      this.recordSuccessfulReport(attribution.moduleId, error);
      
      console.log(`Errors and Echoes: Reported error for ${attribution.moduleId} to ${endpoint.name}`);

    } catch (reportingError) {
      console.warn('Errors and Echoes: Failed to send error report:', reportingError);
      // CRITICAL: NEVER re-throw - don't let reporting errors affect the game
    }
  }

  /**
   * Build the payload to send to the endpoint
   */
  static buildPayload(error, attribution, context) {
    const privacyLevel = window.ErrorsAndEchoes?.ConsentManager?.getPrivacyLevel() || 'standard';
    
    const basePayload = {
      // Always included - core error information
      error: {
        message: error.message || 'Unknown error',
        stack: error.stack || 'No stack trace available',
        type: error.constructor?.name || 'Error',
        source: attribution.source
      },
      
      // Always included - attribution
      attribution: {
        moduleId: attribution.moduleId,
        confidence: attribution.confidence,
        method: attribution.method
      },
      
      // Always included - basic context
      foundry: {
        version: game.version
      },
      
      // Always included - timestamp and privacy info
      meta: {
        timestamp: new Date().toISOString(),
        privacyLevel: privacyLevel,
        reporterVersion: game.modules.get('errors-and-echoes')?.version || 'unknown',
        sessionId: this.getAnonymousSessionId()
      }
    };

    // Add more context based on privacy level
    if (privacyLevel === 'standard' || privacyLevel === 'detailed') {
      basePayload.foundry.system = {
        id: game.system.id,
        version: game.system.version
      };

      // Active modules (only ID and version, no settings)
      basePayload.foundry.modules = game.modules.contents
        .filter(m => m.active)
        .map(m => ({ 
          id: m.id, 
          version: m.version,
          title: m.title // Helpful for debugging
        }));

      // Basic client info
      basePayload.client = {
        sessionId: this.getAnonymousSessionId()
      };
    }

    if (privacyLevel === 'detailed') {
      // Browser info (minimal, no fingerprinting)
      const userAgent = navigator.userAgent;
      const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
      if (browserMatch) {
        basePayload.client.browser = `${browserMatch[1]}/${browserMatch[2]}`;
      }
      
      // Scene context (if available)
      if (canvas?.scene) {
        basePayload.foundry.scene = {
          name: canvas.scene.name,
          active: canvas.scene.active
        };
      }

      // Additional context from error capture
      if (context.filename) {
        basePayload.context = {
          filename: context.filename,
          line: context.lineno,
          column: context.colno
        };
      }

      if (context.hook) {
        basePayload.context = basePayload.context || {};
        basePayload.context.hook = context.hook;
      }
    }

    // Add module-specific context if available from API registration
    const moduleContext = window.ErrorsAndEchoes?.API?.getContext(attribution.moduleId);
    if (moduleContext && Object.keys(moduleContext).length > 0) {
      basePayload.moduleContext = moduleContext;
    }

    return basePayload;
  }

  /**
   * Check if we should send this error report (rate limiting and deduplication)
   */
  static shouldSendReport(error, attribution) {
    // Create a signature for this error
    const errorKey = `${attribution.moduleId}:${error.message}:${this.getStackSignature(error.stack)}`;
    const lastSent = this.recentReports.get(errorKey);
    
    // Deduplication - don't send identical errors repeatedly (1 minute cooldown)
    if (lastSent && (Date.now() - lastSent) < 60000) {
      return false;
    }

    // Rate limiting - max reports per hour
    const hourAgo = Date.now() - 3600000;
    const recentCount = Array.from(this.recentReports.values())
      .filter(timestamp => timestamp > hourAgo).length;
    
    if (recentCount >= this.maxReportsPerHour) {
      console.warn('Errors and Echoes: Rate limit reached, skipping error report');
      return false;
    }

    return true;
  }

  /**
   * Record a successful report for rate limiting and deduplication
   */
  static recordSuccessfulReport(moduleId, error) {
    const errorKey = `${moduleId}:${error.message}:${this.getStackSignature(error.stack)}`;
    this.recentReports.set(errorKey, Date.now());

    // Clean up old entries periodically
    this.cleanupOldReports();
  }

  /**
   * Create a short signature from stack trace for deduplication
   */
  static getStackSignature(stack) {
    if (!stack) return 'no-stack';
    
    // Use first few lines of stack trace to create signature
    const firstLines = stack.split('\n').slice(0, 3).join('\n');
    
    // Create a simple hash-like signature
    let hash = 0;
    for (let i = 0; i < firstLines.length; i++) {
      const char = firstLines.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Generate a daily-rotating anonymous session ID
   */
  static getAnonymousSessionId() {
    const today = new Date().toDateString();
    const storageKey = 'errors-and-echoes-session';
    
    try {
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const [date, id] = stored.split('|');
        if (date === today) {
          return id;
        }
      }

      // Generate new session ID for today
      const newId = 'anon-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(storageKey, `${today}|${newId}`);
      return newId;
    } catch (error) {
      // Fallback if localStorage is not available
      return 'anon-' + Date.now().toString(36);
    }
  }

  /**
   * Clean up old report entries to prevent memory leaks
   */
  static cleanupOldReports() {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    
    for (const [key, timestamp] of this.recentReports) {
      if (timestamp < twoDaysAgo) {
        this.recentReports.delete(key);
      }
    }
  }

  /**
   * Test an endpoint URL
   */
  static async testEndpoint(endpointUrl) {
    try {
      const testUrl = endpointUrl.replace('/report/', '/test/');
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foundry-Version': game.version,
          'X-Module-Version': game.modules.get('errors-and-echoes')?.version || 'unknown'
        },
        body: JSON.stringify({ 
          test: true,
          timestamp: new Date().toISOString(),
          foundry: { version: game.version }
        })
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get statistics about recent reports (for debugging/transparency)
   */
  static getReportStats() {
    const hourAgo = Date.now() - 3600000;
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentTimestamps = Array.from(this.recentReports.values());
    
    return {
      totalReports: this.recentReports.size,
      reportsLastHour: recentTimestamps.filter(t => t > hourAgo).length,
      reportsLastDay: recentTimestamps.filter(t => t > dayAgo).length,
      maxReportsPerHour: this.maxReportsPerHour,
      rateLimitActive: recentTimestamps.filter(t => t > hourAgo).length >= this.maxReportsPerHour
    };
  }
}