/**
 * Shared type definitions for Errors & Echoes module
 */

export interface EndpointConfig {
  name: string;
  url: string;
  author?: string;
  modules?: string[];
  enabled: boolean;
}

export interface ModuleRegistrationOptions {
  contextProvider?: () => Record<string, any>;
  errorFilter?: (error: Error) => boolean;
  endpoint?: EndpointConfig;
}

export interface RegisteredModule {
  moduleId: string;
  contextProvider?: (() => Record<string, any>) | undefined;
  errorFilter?: ((error: Error) => boolean) | undefined;
  endpoint?: EndpointConfig | undefined;
  registrationTime: string;
  lastContextCall?: string | undefined;
  contextCallCount: number;
  filterCallCount: number;
}

export interface ErrorReportResponse {
  success: boolean;
  eventId?: string; // Unique identifier for this error report
  message?: string; // Human-readable status message
  timestamp?: string; // ISO timestamp when the error was processed
  endpoint?: string; // Endpoint that processed the request
  retryAfter?: number; // Seconds to wait before retrying (for rate limiting)
}

export interface BugReportSubmission {
  title: string; // Brief title/summary (required)
  description: string; // User description of the bug (required)
  stepsToReproduce?: string; // Optional steps to reproduce
  expectedBehavior?: string; // What should happen
  actualBehavior?: string; // What actually happens
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'functionality' | 'performance' | 'integration' | 'other';
  module?: string; // Override module detection
  context?: Record<string, any>; // Additional context
}
