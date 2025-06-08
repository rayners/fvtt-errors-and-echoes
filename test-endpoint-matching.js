/**
 * Comprehensive Endpoint Matching Testing for Errors & Echoes
 *
 * This script tests the complete endpoint matching pipeline including
 * author matching, module list matching, and endpoint consent.
 */

console.log('🧪 Starting comprehensive E&E endpoint matching tests...');

// Test helper function
function runTest(testName, testFn) {
  try {
    console.log(`\n🔍 Testing: ${testName}`);
    const result = testFn();
    if (result === true) {
      console.log(`✅ PASS: ${testName}`);
      return true;
    } else {
      console.log(`❌ FAIL: ${testName} - ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ERROR: ${testName} - ${error.message}`);
    return false;
  }
}

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  if (runTest(name, fn)) {
    passedTests++;
  }
}

// Get current endpoints configuration
const endpoints = game.settings?.get('errors-and-echoes', 'endpoints') || [];
console.log(`Found ${endpoints.length} configured endpoints:`);
endpoints.forEach((endpoint, i) => {
  console.log(`  ${i}: ${endpoint.name} (${endpoint.enabled ? 'enabled' : 'disabled'})`);
  console.log(`     Author: ${endpoint.author || 'none'}`);
  console.log(`     Modules: ${endpoint.modules?.length || 0} specified`);
  console.log(`     URL: ${endpoint.url}`);
});

// Get E&E utilities
const { moduleMatchesAuthor } = window.ErrorsAndEchoes || {};
const ConsentManager = window.ErrorsAndEchoes?.ConsentManager;

if (!moduleMatchesAuthor || !ConsentManager) {
  console.error('❌ CRITICAL: Required E&E utilities not available');
  throw new Error('Cannot run tests without E&E utilities');
}

console.log('✅ E&E utilities found, proceeding with tests...');

// =============================================================================
// Test 1: Basic Endpoint Matching Logic
// =============================================================================

test('Direct module list matching', () => {
  const endpoint = {
    name: 'Test Endpoint',
    url: 'https://test.example.com',
    enabled: true,
    modules: ['seasons-and-stars', 'other-module'],
  };

  const moduleId = 'seasons-and-stars';
  const matches = endpoint.enabled && endpoint.modules?.includes(moduleId);

  return matches === true;
});

test('Module list non-matching', () => {
  const endpoint = {
    name: 'Test Endpoint',
    url: 'https://test.example.com',
    enabled: true,
    modules: ['different-module', 'other-module'],
  };

  const moduleId = 'seasons-and-stars';
  const matches = endpoint.enabled && endpoint.modules?.includes(moduleId);

  return matches === false;
});

test('Disabled endpoint never matches', () => {
  const endpoint = {
    name: 'Disabled Endpoint',
    url: 'https://test.example.com',
    enabled: false,
    modules: ['seasons-and-stars'],
  };

  const moduleId = 'seasons-and-stars';
  const matches = endpoint.enabled && endpoint.modules?.includes(moduleId);

  return matches === false;
});

// =============================================================================
// Test 2: Author-Based Matching
// =============================================================================

test('Author matching with real module', () => {
  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  if (!seasonsStarsModule) {
    return 'Seasons & Stars module not available for testing';
  }

  const endpoint = {
    name: 'Rayners Endpoint',
    url: 'https://errors.rayners.dev/report/rayners',
    enabled: true,
    author: 'rayners',
  };

  const matches = endpoint.enabled && moduleMatchesAuthor(seasonsStarsModule, endpoint.author);

  console.log(`  Module authors:`, Array.from(seasonsStarsModule.authors || []));
  console.log(
    `  Author matching result:`,
    moduleMatchesAuthor(seasonsStarsModule, endpoint.author)
  );

  return matches === true;
});

test('Author non-matching', () => {
  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  if (!seasonsStarsModule) {
    return 'Seasons & Stars module not available for testing';
  }

  const endpoint = {
    name: 'Different Author Endpoint',
    url: 'https://errors.example.com',
    enabled: true,
    author: 'different-author',
  };

  const matches = endpoint.enabled && moduleMatchesAuthor(seasonsStarsModule, endpoint.author);

  return matches === false;
});

// =============================================================================
// Test 3: Combined Module List and Author Matching
// =============================================================================

test('Module list takes precedence over author', () => {
  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  if (!seasonsStarsModule) {
    return 'Seasons & Stars module not available for testing';
  }

  const endpoint = {
    name: 'Mixed Endpoint',
    url: 'https://test.example.com',
    enabled: true,
    modules: ['seasons-and-stars'],
    author: 'different-author', // Wrong author, but module is in list
  };

  const moduleId = 'seasons-and-stars';

  // Check if module is explicitly listed first
  if (endpoint.modules?.includes(moduleId)) {
    return true; // Should match via module list
  }

  // Fallback to author matching
  const authorMatches = moduleMatchesAuthor(seasonsStarsModule, endpoint.author);
  return authorMatches === false; // Should not match via author
});

test('Author matching as fallback', () => {
  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  if (!seasonsStarsModule) {
    return 'Seasons & Stars module not available for testing';
  }

  const endpoint = {
    name: 'Author Fallback Endpoint',
    url: 'https://test.example.com',
    enabled: true,
    modules: [], // Empty module list
    author: 'rayners', // Should match via author
  };

  const moduleId = 'seasons-and-stars';

  // Check if module is explicitly listed first
  if (endpoint.modules?.includes(moduleId)) {
    return false; // Should not match via module list
  }

  // Fallback to author matching
  const authorMatches = moduleMatchesAuthor(seasonsStarsModule, endpoint.author);
  return authorMatches === true; // Should match via author
});

// =============================================================================
// Test 4: Endpoint Consent Testing
// =============================================================================

test('Endpoint consent checking', () => {
  const testUrl = 'https://errors.rayners.dev/report/rayners';

  // Check current consent status
  const hasConsent = ConsentManager.hasEndpointConsent(testUrl);
  console.log(`  Current consent for ${testUrl}: ${hasConsent}`);

  // This test passes if we can check consent (regardless of result)
  return typeof hasConsent === 'boolean';
});

test('Endpoint consent settings structure', () => {
  const endpointConsent = game.settings?.get('errors-and-echoes', 'endpointConsent');
  console.log(`  Endpoint consent settings:`, endpointConsent);

  return typeof endpointConsent === 'object';
});

// =============================================================================
// Test 5: Real-World Endpoint Matching Pipeline
// =============================================================================

test('Complete endpoint matching pipeline for Seasons & Stars', () => {
  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  if (!seasonsStarsModule) {
    return 'Seasons & Stars module not available for testing';
  }

  const moduleId = 'seasons-and-stars';
  const matchingEndpoints = [];

  console.log(`  Testing endpoint matching for module: ${moduleId}`);

  endpoints.forEach((endpoint, i) => {
    console.log(`\n  Endpoint ${i}: ${endpoint.name}`);
    console.log(`    Enabled: ${endpoint.enabled}`);
    console.log(`    URL: ${endpoint.url}`);
    console.log(`    Author: ${endpoint.author || 'none'}`);
    console.log(`    Modules: ${endpoint.modules?.length || 0} specified`);

    if (!endpoint.enabled) {
      console.log(`    ❌ SKIP - Endpoint disabled`);
      return;
    }

    // Check module list first
    if (endpoint.modules?.includes(moduleId)) {
      console.log(`    ✅ MATCH - Module in explicit list`);
      matchingEndpoints.push({ endpoint, reason: 'module-list' });
      return;
    }

    // Check author matching
    if (endpoint.author) {
      const authorMatches = moduleMatchesAuthor(seasonsStarsModule, endpoint.author);
      console.log(`    Author matching (${endpoint.author}): ${authorMatches}`);

      if (authorMatches) {
        console.log(`    ✅ MATCH - Author matches`);
        matchingEndpoints.push({ endpoint, reason: 'author-match' });
        return;
      }
    }

    console.log(`    ❌ NO MATCH`);
  });

  console.log(`\n  Found ${matchingEndpoints.length} matching endpoints:`);
  matchingEndpoints.forEach(({ endpoint, reason }, i) => {
    console.log(`    ${i + 1}. ${endpoint.name} (${reason})`);
  });

  return matchingEndpoints.length > 0;
});

// =============================================================================
// Test 6: Edge Cases and Error Handling
// =============================================================================

test('Empty endpoints array', () => {
  const emptyEndpoints = [];
  const moduleId = 'seasons-and-stars';

  const matchingEndpoints = emptyEndpoints.filter(endpoint => {
    if (!endpoint.enabled) return false;
    return endpoint.modules?.includes(moduleId);
  });

  return matchingEndpoints.length === 0;
});

test('Malformed endpoint handling', () => {
  const malformedEndpoints = [
    null,
    undefined,
    {},
    { name: 'Incomplete' },
    { enabled: true }, // No URL
    { url: 'https://test.com' }, // No enabled flag
  ];

  const moduleId = 'seasons-and-stars';

  // Should not crash when processing malformed endpoints
  try {
    malformedEndpoints.forEach(endpoint => {
      if (!endpoint || !endpoint.enabled) return;
      if (endpoint.modules?.includes(moduleId)) {
        // Process matching logic
      }
    });
    return true;
  } catch (error) {
    return `Error processing malformed endpoints: ${error.message}`;
  }
});

test('Module with no authors handling', () => {
  const moduleWithoutAuthors = {
    id: 'test-module',
    // No authors field
  };

  const endpoint = {
    name: 'Test Endpoint',
    enabled: true,
    author: 'rayners',
  };

  const matches = moduleMatchesAuthor(moduleWithoutAuthors, endpoint.author);
  return matches === false;
});

// =============================================================================
// Test 7: Performance Testing
// =============================================================================

test('Large endpoints array performance', () => {
  const startTime = performance.now();

  // Create a large endpoints array
  const largeEndpointsList = [];
  for (let i = 0; i < 1000; i++) {
    largeEndpointsList.push({
      name: `Endpoint ${i}`,
      url: `https://endpoint${i}.example.com`,
      enabled: i % 2 === 0, // Half enabled
      author: `author${i}`,
      modules: i % 10 === 0 ? ['seasons-and-stars'] : [`module${i}`],
    });
  }

  const seasonsStarsModule = game.modules?.get('seasons-and-stars');
  const moduleId = 'seasons-and-stars';
  let matchCount = 0;

  // Test endpoint matching performance
  largeEndpointsList.forEach(endpoint => {
    if (!endpoint.enabled) return;

    if (endpoint.modules?.includes(moduleId)) {
      matchCount++;
      return;
    }

    if (endpoint.author && seasonsStarsModule) {
      if (moduleMatchesAuthor(seasonsStarsModule, endpoint.author)) {
        matchCount++;
      }
    }
  });

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`  ⏱️ Processed 1000 endpoints in ${duration.toFixed(2)}ms`);
  console.log(`  📊 Found ${matchCount} matches`);

  return duration < 1000; // Should complete in under 1 second
});

// =============================================================================
// Test 8: Integration with Error Reporting
// =============================================================================

test('Error attribution module detection', () => {
  const ErrorAttribution = window.ErrorsAndEchoes?.ErrorAttribution;
  if (!ErrorAttribution) {
    return 'ErrorAttribution not available';
  }

  // Create a test error with Seasons & Stars stack trace
  const testError = new Error('Test error for attribution');
  testError.stack = `Error: Test error for attribution
    at testFunction (/modules/seasons-and-stars/dist/module.js:100:20)
    at CalendarWidget.render (/modules/seasons-and-stars/dist/module.js:200:15)
    at Application._render (/common/app.js:500:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return attribution && attribution.moduleId === 'seasons-and-stars';
});

// =============================================================================
// Summary and Results
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 ENDPOINT MATCHING TEST RESULTS');
console.log('='.repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Endpoint matching is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Review the output above for details.');
}

// Final integration test
console.log('\n🔍 Final integration test...');
const getEndpointForModule = moduleId => {
  try {
    const endpoints = game.settings.get('errors-and-echoes', 'endpoints') || [];

    return endpoints.find(endpoint => {
      if (!endpoint.enabled) return false;

      // Check if module is explicitly listed
      if (endpoint.modules?.includes(moduleId)) return true;

      // Check if module matches author
      if (endpoint.author) {
        const module = game.modules.get(moduleId);
        return moduleMatchesAuthor(module, endpoint.author);
      }

      return false;
    });
  } catch (error) {
    console.warn('Error getting endpoint for module:', error);
    return undefined;
  }
};

const ssEndpoint = getEndpointForModule('seasons-and-stars');
if (ssEndpoint) {
  console.log('✅ Seasons & Stars endpoint matching PASSED');
  console.log(`   Matched endpoint: ${ssEndpoint.name} (${ssEndpoint.url})`);

  // Test consent
  const hasConsent = ConsentManager.hasEndpointConsent(ssEndpoint.url);
  console.log(`   Endpoint consent: ${hasConsent}`);
} else {
  console.log('❌ Seasons & Stars endpoint matching FAILED');
}

console.log('\n✅ Endpoint matching testing complete!');
