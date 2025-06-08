/**
 * Error Reporter System
 *
 * Handles sending error reports to configured endpoints with rate limiting,
 * deduplication, and privacy controls.
 */

import { ConsentManager, type PrivacyLevel } from './consent-manager.js';
import { ModuleRegistry } from './module-registry.js';
import type { Attribution } from './error-attribution.js';
import type { EndpointConfig, ErrorReportResponse } from './types.js';
import { debugLog } from './utils.js';

interface ReportPayload {
  error: {
    message: string;
    stack?: string | undefined;
    type: string;
    source: string;
  };
  attribution: Attribution;
  foundry: {
    version: string;
    system?: {
      id: string;
      version: string;
    };
    modules?: Array<{
      id: string;
      version: string;
    }>;
    scene?: string;
  };
  client?: {
    sessionId: string;
    browser?: string;
  };
  meta: {
    timestamp: string;
    privacyLevel: PrivacyLevel;
    reporterVersion: string;
  };
  moduleContext?: Record<string, any>;
}

interface ReportStats {
  totalReports: number;
  recentReports: number;
  lastReportTime?: string | undefined;
}

export class ErrorReporter {
  private static recentReports = new Map<string, number>(); // For deduplication
  private static reportCount = 0;
  private static lastReportTime: string | null = null;
  private static readonly maxReportsPerHour = 50; // Rate limiting
  private static readonly deduplicationWindow = 60000; // 1 minute

  /**
   * Send an error report to the specified endpoint
   */
  static async sendReport(
    error: Error,
    attribution: Attribution,
    endpoint: EndpointConfig,
    moduleContext: Record<string, any> = {}
  ): Promise<void> {
    // Check rate limiting
    if (!this.shouldSendReport(error, attribution)) {
      return;
    }

    // Check module-specific error filtering
    if (ModuleRegistry.shouldFilterError(attribution.moduleId, error)) {
      debugLog(
        `Errors and Echoes: Error filtered by module '${attribution.moduleId}' error filter`
      );
      return;
    }

    // Check endpoint consent
    if (!ConsentManager.hasEndpointConsent(endpoint.url)) {
      return;
    }

    // Get enhanced context from module registry if module is registered
    const enhancedContext = { ...moduleContext };
    if (ModuleRegistry.isRegistered(attribution.moduleId)) {
      const registryContext = ModuleRegistry.getModuleContext(attribution.moduleId);
      Object.assign(enhancedContext, registryContext);
    }

    const privacyLevel = ConsentManager.getPrivacyLevel();
    const payload = this.buildPayload(error, attribution, privacyLevel, enhancedContext);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foundry-Version': game.version,
          'X-Module-Version': this.getModuleVersion(),
          'X-Privacy-Level': privacyLevel,
          'User-Agent': this.getUserAgent(),
        },
        body: JSON.stringify(payload),
      });

      // Parse standard response format
      const reportResponse: ErrorReportResponse = await response.json();

      if (!reportResponse.success) {
        const errorMsg =
          reportResponse.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Track successful report for rate limiting and user transparency
      this.recordSuccessfulReport(attribution.moduleId, error, reportResponse.eventId);
    } catch (reportingError) {
      console.warn('Errors and Echoes: Failed to send error report:', reportingError);
      // CRITICAL: NEVER re-throw - don't let reporting errors affect the game
    }
  }

  /**
   * Build the payload for error reporting based on privacy level
   */
  private static buildPayload(
    error: Error,
    attribution: Attribution,
    privacyLevel: PrivacyLevel,
    moduleContext: Record<string, any>
  ): ReportPayload {
    const payload: ReportPayload = {
      // Always included - core error information
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        source: attribution.source,
      },

      // Always included - attribution
      attribution,

      // Always included - basic Foundry context
      foundry: {
        version: game.version,
      },

      // Always included - timestamp and privacy info
      meta: {
        timestamp: new Date().toISOString(),
        privacyLevel,
        reporterVersion: this.getModuleVersion(),
      },
    };

    // Add more context based on privacy level
    if (privacyLevel === 'standard' || privacyLevel === 'detailed') {
      payload.foundry.system = {
        id: game.system.id,
        version: game.system.version,
      };

      payload.foundry.modules = game.modules.contents
        .filter(m => m.active)
        .map(m => ({ id: m.id, version: m.version }));

      payload.client = {
        sessionId: this.getAnonymousSessionId(),
      };
    }

    if (privacyLevel === 'detailed') {
      // Add browser info (just name/version, not full user agent)
      if (payload.client) {
        payload.client.browser = this.getBrowserInfo();
      }

      // Add current scene name if available
      if (canvas.scene) {
        payload.foundry.scene = canvas.scene.name;
      }
    }

    // Add module-specific context if available
    if (moduleContext && Object.keys(moduleContext).length > 0) {
      payload.moduleContext = moduleContext;
    }

    return payload;
  }

  /**
   * Check if this error should be reported (rate limiting and deduplication)
   */
  private static shouldSendReport(error: Error, attribution: Attribution): boolean {
    // Deduplication - don't send identical errors repeatedly
    const errorKey = `${attribution.moduleId}:${error.message}:${this.getStackSignature(error.stack)}`;
    const lastSent = this.recentReports.get(errorKey);

    if (lastSent && Date.now() - lastSent < this.deduplicationWindow) {
      return false;
    }

    // Rate limiting - max reports per hour
    const hourAgo = Date.now() - 3600000;
    const recentCount = Array.from(this.recentReports.values()).filter(
      timestamp => timestamp > hourAgo
    ).length;

    if (recentCount >= this.maxReportsPerHour) {
      console.warn(
        `Errors and Echoes: Rate limit reached (${this.maxReportsPerHour} reports/hour)`
      );
      return false;
    }

    return true;
  }

  /**
   * Record a successful report for rate limiting and statistics
   */
  private static recordSuccessfulReport(moduleId: string, error: Error, eventId?: string): void {
    const errorKey = `${moduleId}:${error.message}:${this.getStackSignature(error.stack)}`;
    this.recentReports.set(errorKey, Date.now());
    this.reportCount++;
    this.lastReportTime = new Date().toISOString();

    // Clean up old entries
    this.cleanupOldReports();

    // Always show console feedback with event ID for user reference
    if (eventId) {
      console.log(
        `🚨 Error reported to monitoring service | Module: ${moduleId} | Event ID: ${eventId}`
      );
      console.log(`   Users can reference this ID when reporting issues or requesting support.`);
    } else {
      console.log(`🚨 Error reported to monitoring service | Module: ${moduleId}`);
    }

    // Optional: Show user notifications for debugging
    if (game.settings.get('errors-and-echoes', 'showReportNotifications')) {
      if (eventId) {
        ui.notifications?.info(`Error reported for ${moduleId} (ID: ${eventId})`);
      } else {
        ui.notifications?.info(`Error reported for ${moduleId}`);
      }
    }
  }

  /**
   * Clean up old report entries to prevent memory leaks
   */
  private static cleanupOldReports(): void {
    const hourAgo = Date.now() - 3600000;

    for (const [key, timestamp] of this.recentReports.entries()) {
      if (timestamp < hourAgo) {
        this.recentReports.delete(key);
      }
    }
  }

  /**
   * Create a short signature from stack trace for deduplication
   */
  static getStackSignature(stack?: string): string {
    if (!stack) return 'no-stack';

    try {
      // Use first 100 characters of stack trace as signature
      return btoa(stack.substring(0, 100)).substring(0, 10);
    } catch {
      return 'invalid-stack';
    }
  }

  /**
   * Generate a daily-rotating anonymous session ID
   */
  private static getAnonymousSessionId(): string {
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
    } catch {
      // Fallback if localStorage is not available
      return 'anon-' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Get the module version
   */
  private static getModuleVersion(): string {
    const module = game.modules.get('errors-and-echoes');
    return module?.version || '1.0.0';
  }

  /**
   * Get simplified browser information
   */
  private static getBrowserInfo(): string {
    try {
      const userAgent = navigator.userAgent;

      // Extract just browser name and version
      if (userAgent.includes('Chrome/')) {
        const match = userAgent.match(/Chrome\/(\d+)/);
        return match ? `Chrome/${match[1]}` : 'Chrome';
      }

      if (userAgent.includes('Firefox/')) {
        const match = userAgent.match(/Firefox\/(\d+)/);
        return match ? `Firefox/${match[1]}` : 'Firefox';
      }

      if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/(\d+)/);
        return match ? `Safari/${match[1]}` : 'Safari';
      }

      if (userAgent.includes('Edge/')) {
        const match = userAgent.match(/Edge\/(\d+)/);
        return match ? `Edge/${match[1]}` : 'Edge';
      }

      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get user agent for API requests
   */
  private static getUserAgent(): string {
    const moduleVersion = this.getModuleVersion();
    const foundryVersion = game.version;
    return `ErrorsAndEchoes/${moduleVersion} FoundryVTT/${foundryVersion}`;
  }

  /**
   * Get report statistics for debugging and transparency
   */
  static getReportStats(): ReportStats {
    const hourAgo = Date.now() - 3600000;
    const recentCount = Array.from(this.recentReports.values()).filter(
      timestamp => timestamp > hourAgo
    ).length;

    return {
      totalReports: this.reportCount,
      recentReports: recentCount,
      lastReportTime: this.lastReportTime || undefined,
    };
  }

  /**
   * Clear all report statistics (for testing/debugging)
   */
  static clearStats(): void {
    this.recentReports.clear();
    this.reportCount = 0;
    this.lastReportTime = null;
  }

  /**
   * Test an endpoint URL
   */
  static async testEndpoint(url: string): Promise<boolean> {
    try {
      // Create test URL by replacing '/report/' with '/test/'
      const testUrl = url.replace('/report/', '/test/');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Foundry-Version': game.version,
            'X-Module-Version': this.getModuleVersion(),
          },
          body: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
            source: 'endpoint-test',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse standard response format
        let testResponse: ErrorReportResponse;
        try {
          testResponse = await response.json();
        } catch {
          // Handle cases where response is not valid JSON (e.g., HTML error pages)
          console.warn('Endpoint test failed: Invalid JSON response');
          return false;
        }

        if (testResponse.success && testResponse.eventId) {
          console.log(`✅ Endpoint test successful | Event ID: ${testResponse.eventId}`);
          return true;
        } else {
          console.warn('Endpoint test failed:', testResponse.message || 'Unknown error');
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Handle fetch errors (network issues, timeouts, etc.)
        if (fetchError.name === 'AbortError') {
          console.warn('Endpoint test failed: Request timeout');
        } else {
          console.warn('Endpoint test failed: Network error', fetchError);
        }
        return false;
      }
    } catch (error) {
      console.warn('Endpoint test failed:', error);
      return false;
    }
  }
}
