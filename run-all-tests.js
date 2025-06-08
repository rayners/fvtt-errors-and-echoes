/**
 * Master Test Runner for Errors & Echoes Author Attribution
 *
 * This script runs all comprehensive tests for the E&E system including:
 * - Author attribution logic
 * - Endpoint matching
 * - Error attribution engine
 * - Integration testing
 */

console.log('🚀 Starting comprehensive E&E testing suite...');
console.log('=' * 80);

// Check E&E availability
if (!window.ErrorsAndEchoes) {
  console.error('❌ CRITICAL: Errors & Echoes not loaded or not available');
  console.log(
    'Available on window:',
    Object.keys(window).filter(k => k.toLowerCase().includes('error'))
  );
  throw new Error('Cannot run tests without E&E module loaded');
}

console.log('✅ Errors & Echoes detected');
console.log('Available E&E components:', Object.keys(window.ErrorsAndEchoes));

// Test Results Tracking
const testSuites = [];
let totalTests = 0;
let totalPassed = 0;

async function runTestSuite(name, scriptPath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 RUNNING TEST SUITE: ${name}`);
  console.log(`${'='.repeat(80)}`);

  const startTime = performance.now();

  try {
    // Load and execute the test script
    const response = await fetch(scriptPath);
    const scriptContent = await response.text();

    // Capture console output for this test suite
    const originalLog = console.log;
    const capturedOutput = [];
    console.log = (...args) => {
      capturedOutput.push(args.join(' '));
      originalLog(...args);
    };

    // Execute the test script
    eval(scriptContent);

    // Restore console.log
    console.log = originalLog;

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Parse results from captured output
    const resultsLine = capturedOutput.find(line => line.includes('Success Rate:'));
    const passedLine = capturedOutput.find(line => line.includes('Passed:'));
    const totalLine = capturedOutput.find(line => line.includes('Total Tests:'));

    let suiteTests = 0;
    let suitePassed = 0;
    let successRate = 0;

    if (totalLine) {
      suiteTests = parseInt(totalLine.match(/Total Tests: (\d+)/)?.[1] || '0');
    }

    if (passedLine) {
      suitePassed = parseInt(passedLine.match(/Passed: (\d+)/)?.[1] || '0');
    }

    if (resultsLine) {
      successRate = parseFloat(resultsLine.match(/Success Rate: ([\d.]+)%/)?.[1] || '0');
    }

    const suiteResult = {
      name,
      tests: suiteTests,
      passed: suitePassed,
      failed: suiteTests - suitePassed,
      successRate,
      duration: duration.toFixed(2),
    };

    testSuites.push(suiteResult);
    totalTests += suiteTests;
    totalPassed += suitePassed;

    console.log(`\n📊 ${name} Results:`);
    console.log(
      `   Tests: ${suiteTests}, Passed: ${suitePassed}, Failed: ${suiteTests - suitePassed}`
    );
    console.log(`   Success Rate: ${successRate}%, Duration: ${duration.toFixed(2)}ms`);

    if (successRate === 100) {
      console.log(`   ✅ ${name} PASSED`);
    } else {
      console.log(`   ❌ ${name} FAILED`);
    }
  } catch (error) {
    console.error(`💥 CRITICAL ERROR in ${name}:`, error.message);
    testSuites.push({
      name,
      tests: 0,
      passed: 0,
      failed: 1,
      successRate: 0,
      duration: '0',
      error: error.message,
    });
  }
}

// System Information
console.log('\n🔍 System Information:');
console.log(`Browser: ${navigator.userAgent}`);
console.log(`Foundry Version: ${game.version || 'Unknown'}`);
console.log(`E&E Module Active: ${game.modules?.get('errors-and-echoes')?.active || false}`);
console.log(`S&S Module Active: ${game.modules?.get('seasons-and-stars')?.active || false}`);

// Current Settings
console.log('\n⚙️ Current E&E Settings:');
const globalEnabled = game.settings?.get('errors-and-echoes', 'globalEnabled');
const privacyLevel = game.settings?.get('errors-and-echoes', 'privacyLevel');
const endpoints = game.settings?.get('errors-and-echoes', 'endpoints');
const endpointConsent = game.settings?.get('errors-and-echoes', 'endpointConsent');

console.log(`Global Enabled: ${globalEnabled}`);
console.log(`Privacy Level: ${privacyLevel}`);
console.log(`Endpoints: ${endpoints?.length || 0} configured`);
console.log(`Endpoint Consent: ${Object.keys(endpointConsent || {}).length} endpoints`);

if (endpoints) {
  console.log('\nConfigured Endpoints:');
  endpoints.forEach((endpoint, i) => {
    console.log(`  ${i + 1}. ${endpoint.name} (${endpoint.enabled ? 'enabled' : 'disabled'})`);
    console.log(`     Author: ${endpoint.author || 'none'}`);
    console.log(`     Modules: ${endpoint.modules?.length || 0}`);
    console.log(`     URL: ${endpoint.url}`);
  });
}

// Run Test Suites
async function runAllTests() {
  const startTime = performance.now();

  await runTestSuite('Author Attribution', './test-author-attribution.js');
  await runTestSuite('Endpoint Matching', './test-endpoint-matching.js');
  await runTestSuite('Error Attribution', './test-error-attribution.js');

  const endTime = performance.now();
  const totalDuration = endTime - startTime;

  // Final Results Summary
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  testSuites.forEach(suite => {
    const status = suite.successRate === 100 ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${status} ${suite.name}: ${suite.passed}/${suite.tests} (${suite.successRate}%) [${suite.duration}ms]`
    );
    if (suite.error) {
      console.log(`    💥 Error: ${suite.error}`);
    }
  });

  const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  const failedSuites = testSuites.filter(s => s.successRate < 100).length;

  console.log('\n📊 Overall Results:');
  console.log(`Total Test Suites: ${testSuites.length}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalTests - totalPassed}`);
  console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
  console.log(`Failed Suites: ${failedSuites}`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);

  if (failedSuites === 0) {
    console.log('\n🎉 ALL TEST SUITES PASSED!');
    console.log('🔥 E&E Author Attribution system is working perfectly!');
  } else {
    console.log('\n⚠️ Some test suites failed.');
    console.log('Review the detailed output above for specific issues.');
  }

  // Performance Analysis
  console.log('\n⚡ Performance Analysis:');
  const avgTestTime = totalDuration / totalTests;
  console.log(`Average time per test: ${avgTestTime.toFixed(2)}ms`);

  if (avgTestTime < 5) {
    console.log('✅ Excellent performance - tests running very efficiently');
  } else if (avgTestTime < 20) {
    console.log('✅ Good performance - tests running efficiently');
  } else {
    console.log('⚠️ Consider optimizing test performance');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');

  if (overallSuccessRate === 100) {
    console.log('✅ All systems operational - ready for production use');
    console.log('✅ Author attribution working correctly across all scenarios');
    console.log('✅ Endpoint matching functioning properly');
    console.log('✅ Error attribution engine performing well');
  } else {
    console.log('🔧 Address failing tests before production deployment');

    const failedAuthorTests = testSuites.find(
      s => s.name === 'Author Attribution' && s.successRate < 100
    );
    if (failedAuthorTests) {
      console.log('🔧 Review author matching logic - check module.json author fields');
    }

    const failedEndpointTests = testSuites.find(
      s => s.name === 'Endpoint Matching' && s.successRate < 100
    );
    if (failedEndpointTests) {
      console.log('🔧 Review endpoint configuration and consent settings');
    }

    const failedAttributionTests = testSuites.find(
      s => s.name === 'Error Attribution' && s.successRate < 100
    );
    if (failedAttributionTests) {
      console.log('🔧 Review error attribution engine and stack trace parsing');
    }
  }

  console.log('\n✅ Comprehensive E&E testing complete!');

  return {
    totalSuites: testSuites.length,
    totalTests,
    totalPassed,
    overallSuccessRate,
    failedSuites,
    duration: totalDuration,
    testSuites,
  };
}

// Run the tests
runAllTests()
  .then(results => {
    console.log('\n🎯 Test execution completed');

    // Store results for potential further analysis
    window.EETestResults = results;
    console.log('Results stored in window.EETestResults for analysis');
  })
  .catch(error => {
    console.error('💥 CRITICAL: Test execution failed:', error);
    throw error;
  });
