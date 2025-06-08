/**
 * Tests for ErrorReporter class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, setMockSetting } from './setup';
import type { Attribution } from '../src/error-attribution';

// Import after mocks are set up
beforeEach(async () => {
  resetMocks();
  
  // Set up default settings for error reporter
  setMockSetting('errors-and-echoes', 'globalEnabled', true);
  setMockSetting('errors-and-echoes', 'privacyLevel', 'standard');
  setMockSetting('errors-and-echoes', 'endpointConsent', {});
  setMockSetting('errors-and-echoes', 'showReportNotifications', false);
  
  // Clear any existing imports to ensure fresh state
  vi.resetModules();
});

describe('ErrorReporter', () => {
  it('should export ErrorReporter class', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    expect(ErrorReporter).toBeDefined();
    expect(typeof ErrorReporter.sendReport).toBe('function');
    expect(typeof ErrorReporter.getReportStats).toBe('function');
  });

  it('should generate report statistics', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    
    const stats = ErrorReporter.getReportStats();
    expect(stats).toHaveProperty('totalReports');
    expect(stats).toHaveProperty('recentReports');
    expect(stats).toHaveProperty('lastReportTime');
    expect(typeof stats.totalReports).toBe('number');
    expect(typeof stats.recentReports).toBe('number');
  });

  it('should clear statistics', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    
    ErrorReporter.clearStats();
    const stats = ErrorReporter.getReportStats();
    expect(stats.totalReports).toBe(0);
    expect(stats.recentReports).toBe(0);
    expect(stats.lastReportTime).toBeUndefined();
  });

  it('should test endpoint connectivity', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    
    // Mock successful response
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        eventId: 'test-event-123'
      })
    });

    const result = await ErrorReporter.testEndpoint('https://test.example.com/report/test');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://test.example.com/test/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle failed endpoint tests', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    
    // Mock failed response
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await ErrorReporter.testEndpoint('https://invalid.example.com/report/test');
    expect(result).toBe(false);
  });

  it('should build payload with correct structure', async () => {
    const { ErrorReporter } = await import('../src/error-reporter');
    
    // Import ConsentManager to mock consent
    const { ConsentManager } = await import('../src/consent-manager');
    vi.spyOn(ConsentManager, 'hasEndpointConsent').mockReturnValue(true);
    vi.spyOn(ConsentManager, 'getPrivacyLevel').mockReturnValue('standard');

    const error = new Error('Test error');
    const attribution: Attribution = {
      moduleId: 'test-module',
      confidence: 'high',
      method: 'stack-trace',
      source: 'automatic'
    };
    const endpoint = {
      name: 'Test Endpoint',
      url: 'https://test.example.com/report/test',
      enabled: true
    };

    // Mock successful response
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        eventId: 'test-event-123'
      })
    });

    await ErrorReporter.sendReport(error, attribution, endpoint);

    expect(fetch).toHaveBeenCalledWith(
      endpoint.url,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Foundry-Version': '13.331',
          'X-Privacy-Level': 'standard'
        }),
        body: expect.stringContaining('"message":"Test error"')
      })
    );
  });
});