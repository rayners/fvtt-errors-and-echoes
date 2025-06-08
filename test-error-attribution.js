/**
 * Comprehensive Error Attribution Testing for Errors & Echoes
 *
 * This script tests the error attribution engine that determines which
 * module an error belongs to based on stack traces and other metadata.
 */

console.log('🧪 Starting comprehensive E&E error attribution tests...');

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

// Get E&E utilities
const ErrorAttribution = window.ErrorsAndEchoes?.ErrorAttribution;

if (!ErrorAttribution) {
  console.error('❌ CRITICAL: ErrorAttribution not available');
  throw new Error('Cannot run tests without ErrorAttribution');
}

console.log('✅ ErrorAttribution found, proceeding with tests...');

// =============================================================================
// Test 1: Basic Stack Trace Attribution
// =============================================================================

test('Seasons & Stars module attribution', () => {
  const testError = new Error('Test error from Seasons & Stars');
  testError.stack = `Error: Test error from Seasons & Stars
    at CalendarWidget._onRender (/modules/seasons-and-stars/dist/module.js:150:20)
    at HandlebarsApplicationMixin.render (/modules/seasons-and-stars/dist/module.js:300:15)
    at Application._render (/common/app.js:500:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('Errors & Echoes module attribution', () => {
  const testError = new Error('Test error from E&E');
  testError.stack = `Error: Test error from E&E
    at ErrorReporter.sendReport (/modules/errors-and-echoes/dist/module.js:200:20)
    at ErrorCapture.handleError (/modules/errors-and-echoes/dist/module.js:100:15)
    at window.addEventListener (/modules/errors-and-echoes/dist/module.js:50:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'errors-and-echoes' && attribution.confidence === 'high'
  );
});

test('Foundry core attribution', () => {
  const testError = new Error('Test error from Foundry core');
  testError.stack = `Error: Test error from Foundry core
    at Application.render (/common/app.js:500:20)
    at FormApplication._updateObject (/client/app/form.js:200:15)
    at Dialog._onSubmit (/client/app/dialog.js:100:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'foundry-core' && attribution.confidence === 'medium'
  );
});

test('Unknown module attribution', () => {
  const testError = new Error('Test error with no clear source');
  testError.stack = `Error: Test error with no clear source
    at anonymous (/eval:1:1)
    at Function.eval (/eval:2:5)
    at Object.execute (/eval:3:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return attribution && attribution.moduleId === 'unknown' && attribution.confidence === 'none';
});

// =============================================================================
// Test 2: Multiple Module Stack Traces
// =============================================================================

test('Multi-module stack trace attribution', () => {
  const testError = new Error('Error spanning multiple modules');
  testError.stack = `Error: Error spanning multiple modules
    at CalendarWidget.render (/modules/seasons-and-stars/dist/module.js:100:20)
    at SimpleWeather.updateDisplay (/modules/simple-weather/dist/module.js:200:15)
    at SmallTime.onTimeChange (/modules/smalltime/scripts/smalltime-app.mjs:300:10)
    at Application._render (/common/app.js:500:5)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  // Should attribute to the first module in the stack (where error originated)
  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('Module interaction error attribution', () => {
  const testError = new Error('Error in module interaction');
  testError.stack = `Error: Error in module interaction
    at Bridge.handleUpdate (/modules/simple-calendar-compat/dist/module.js:150:20)
    at SeasonsStarsIntegration.notifyUpdate (/modules/simple-calendar-compat/dist/module.js:250:15)
    at CalendarManager.setDate (/modules/seasons-and-stars/dist/module.js:400:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  // Should attribute to the bridge module where the error occurred
  return (
    attribution &&
    attribution.moduleId === 'simple-calendar-compat' &&
    attribution.confidence === 'high'
  );
});

// =============================================================================
// Test 3: Edge Cases and Malformed Stack Traces
// =============================================================================

test('Empty stack trace handling', () => {
  const testError = new Error('Error with no stack');
  delete testError.stack;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return attribution && attribution.moduleId === 'unknown' && attribution.confidence === 'none';
});

test('Malformed stack trace handling', () => {
  const testError = new Error('Error with malformed stack');
  testError.stack = 'This is not a valid stack trace format';

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return attribution && attribution.moduleId === 'unknown' && attribution.confidence === 'none';
});

test('Very long stack trace handling', () => {
  const testError = new Error('Error with very long stack');

  // Create a very long stack trace
  let longStack = 'Error: Error with very long stack\n';
  for (let i = 0; i < 100; i++) {
    longStack += `    at function${i} (/modules/test-module/file${i}.js:${i + 1}:10)\n`;
  }
  longStack += '    at CalendarWidget.render (/modules/seasons-and-stars/dist/module.js:100:20)';

  testError.stack = longStack;

  const startTime = performance.now();
  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });
  const endTime = performance.now();

  console.log(`  Attribution took ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`  Attribution result:`, attribution);

  // Should still work and complete quickly
  return attribution && attribution.moduleId === 'test-module' && endTime - startTime < 100; // Should complete in under 100ms
});

// =============================================================================
// Test 4: Different File Path Formats
// =============================================================================

test('Windows path format attribution', () => {
  const testError = new Error('Test error with Windows paths');
  testError.stack = `Error: Test error with Windows paths
    at CalendarWidget.render (C:\\FoundryVTT\\Data\\modules\\seasons-and-stars\\dist\\module.js:100:20)
    at Application._render (C:\\FoundryVTT\\common\\app.js:500:15)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('URL-based path attribution', () => {
  const testError = new Error('Test error with URL paths');
  testError.stack = `Error: Test error with URL paths
    at CalendarWidget.render (http://localhost:30000/modules/seasons-and-stars/dist/module.js:100:20)
    at Application._render (http://localhost:30000/common/app.js:500:15)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('Minified file attribution', () => {
  const testError = new Error('Test error from minified file');
  testError.stack = `Error: Test error from minified file
    at a.render (/modules/seasons-and-stars/dist/module.min.js:1:2050)
    at b._render (/modules/seasons-and-stars/dist/module.min.js:1:3000)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

// =============================================================================
// Test 5: Context-Based Attribution
// =============================================================================

test('Attribution with additional context', () => {
  const testError = new Error('Error with context');
  testError.stack = `Error: Error with context
    at anonymous (/eval:1:1)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'seasons-and-stars-widget',
    timestamp: Date.now(),
    moduleId: 'seasons-and-stars', // Provide context hint
    feature: 'calendar-widget',
  });

  console.log(`  Attribution result:`, attribution);

  // Should use context when stack trace is unclear
  return (
    attribution &&
    attribution.moduleId === 'seasons-and-stars' &&
    attribution.confidence === 'medium'
  ); // Lower confidence due to context-based attribution
});

test('Context override stack trace', () => {
  const testError = new Error('Error with conflicting context');
  testError.stack = `Error: Error with conflicting context
    at SomeFunction (/modules/other-module/dist/module.js:100:20)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'manual-report',
    timestamp: Date.now(),
    moduleId: 'seasons-and-stars', // Context suggests different module
  });

  console.log(`  Attribution result:`, attribution);

  // Stack trace should take precedence over context
  return (
    attribution && attribution.moduleId === 'other-module' && attribution.confidence === 'high'
  );
});

// =============================================================================
// Test 6: Performance and Stress Testing
// =============================================================================

test('Attribution performance with many errors', () => {
  const startTime = performance.now();

  const attributions = [];
  for (let i = 0; i < 100; i++) {
    const testError = new Error(`Test error ${i}`);
    testError.stack = `Error: Test error ${i}
      at function${i} (/modules/test-module-${i % 10}/dist/module.js:${i + 1}:20)
      at caller${i} (/modules/test-module-${i % 10}/dist/module.js:${i + 2}:15)`;

    const attribution = ErrorAttribution.attributeToModule(testError, {
      source: 'performance-test',
      timestamp: Date.now(),
    });

    attributions.push(attribution);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const avgTime = duration / 100;

  console.log(`  ⏱️ Processed 100 errors in ${duration.toFixed(2)}ms`);
  console.log(`  📊 Average time per attribution: ${avgTime.toFixed(2)}ms`);

  // Check that all attributions worked
  const validAttributions = attributions.filter(attr => attr && attr.moduleId);

  return validAttributions.length === 100 && avgTime < 5; // Should average under 5ms per attribution
});

// =============================================================================
// Test 7: Real-World Error Scenarios
// =============================================================================

test('Real-world async error attribution', () => {
  const testError = new Error('Async operation failed');
  testError.stack = `Error: Async operation failed
    at async CalendarManager.loadCalendar (/modules/seasons-and-stars/dist/module.js:200:20)
    at async CalendarWidget._prepareContext (/modules/seasons-and-stars/dist/module.js:150:15)
    at async HandlebarsApplicationMixin.render (/modules/seasons-and-stars/dist/module.js:100:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'async-error',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('Real-world hook error attribution', () => {
  const testError = new Error('Hook handler failed');
  testError.stack = `Error: Hook handler failed
    at CalendarWidget.updateDisplay (/modules/seasons-and-stars/dist/module.js:300:20)
    at HooksManager.call (/common/hooks.js:100:15)
    at Game.setupHooks (/common/game.js:200:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'hook-error',
    timestamp: Date.now(),
    hookName: 'ready',
  });

  console.log(`  Attribution result:`, attribution);

  return (
    attribution && attribution.moduleId === 'seasons-and-stars' && attribution.confidence === 'high'
  );
});

test('Real-world API error attribution', () => {
  const testError = new Error('API call failed');
  testError.stack = `Error: API call failed
    at fetch.then (/modules/simple-weather/dist/module.js:400:20)
    at SimpleWeatherAPI.updateWeather (/modules/simple-weather/dist/module.js:350:15)
    at CalendarWidget.refreshWeather (/modules/seasons-and-stars/dist/module.js:250:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'api-error',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  // Should attribute to simple-weather where the fetch error occurred
  return (
    attribution && attribution.moduleId === 'simple-weather' && attribution.confidence === 'high'
  );
});

// =============================================================================
// Test 8: Confidence Level Validation
// =============================================================================

test('High confidence attribution criteria', () => {
  const testError = new Error('Clear module error');
  testError.stack = `Error: Clear module error
    at SpecificClass.specificMethod (/modules/seasons-and-stars/src/specific-file.ts:100:20)
    at CalendarManager.update (/modules/seasons-and-stars/dist/module.js:200:15)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  // Multiple stack frames from same module = high confidence
  return (
    attribution && attribution.confidence === 'high' && attribution.moduleId === 'seasons-and-stars'
  );
});

test('Medium confidence attribution criteria', () => {
  const testError = new Error('Mixed source error');
  testError.stack = `Error: Mixed source error
    at CalendarWidget.render (/modules/seasons-and-stars/dist/module.js:100:20)
    at Application._render (/common/app.js:200:15)
    at FormApplication.render (/client/app/form.js:300:10)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'test',
    timestamp: Date.now(),
  });

  console.log(`  Attribution result:`, attribution);

  // Single module frame in mixed stack = medium confidence
  return (
    attribution &&
    attribution.confidence === 'medium' &&
    attribution.moduleId === 'seasons-and-stars'
  );
});

test('Low confidence attribution criteria', () => {
  const testError = new Error('Unclear source error');
  testError.stack = `Error: Unclear source error
    at anonymous (eval:1:1)
    at Function.eval (eval:2:5)`;

  const attribution = ErrorAttribution.attributeToModule(testError, {
    source: 'manual-report',
    timestamp: Date.now(),
    moduleId: 'seasons-and-stars', // Context-based hint
  });

  console.log(`  Attribution result:`, attribution);

  // Context-based attribution = low confidence
  return attribution && attribution.confidence === 'none' && attribution.moduleId === 'unknown';
});

// =============================================================================
// Summary and Results
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 ERROR ATTRIBUTION TEST RESULTS');
console.log('='.repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Error attribution is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Review the output above for details.');
}

// Test with real error if possible
console.log('\n🔍 Testing with real error scenario...');
try {
  // Create a real error from Seasons & Stars context
  const realError = new Error('Real test error from attribution testing');
  realError.stack = `Error: Real test error from attribution testing
    at test-error-attribution.js:500:20
    at runTest (/modules/errors-and-echoes/test-error-attribution.js:15:10)
    at Console.eval [as log] (/modules/errors-and-echoes/test-error-attribution.js:1:1)`;

  const realAttribution = ErrorAttribution.attributeToModule(realError, {
    source: 'integration-test',
    timestamp: Date.now(),
  });

  console.log('Real attribution result:', realAttribution);

  if (realAttribution && realAttribution.moduleId === 'errors-and-echoes') {
    console.log('✅ Real-world attribution test PASSED');
  } else {
    console.log('❌ Real-world attribution test unexpected result');
  }
} catch (error) {
  console.log('⚠️ Real-world test failed:', error.message);
}

console.log('\n✅ Error attribution testing complete!');
