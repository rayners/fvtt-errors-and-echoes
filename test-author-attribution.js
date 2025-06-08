/**
 * Comprehensive Author Attribution Testing for Errors & Echoes
 *
 * This script thoroughly tests the author matching logic with various
 * module configurations to ensure robust endpoint matching.
 */

console.log('🧪 Starting comprehensive E&E author attribution tests...');

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

// Get the author utilities
const {
  moduleMatchesAuthor,
  extractAuthorNames,
  getPrimaryAuthorName,
  getFormattedAuthorString,
  hasAuthorInfo,
} = window.ErrorsAndEchoes || {};

if (!moduleMatchesAuthor) {
  console.error('❌ CRITICAL: moduleMatchesAuthor function not available. Is E&E loaded?');
  console.log('Available E&E functions:', Object.keys(window.ErrorsAndEchoes || {}));
  throw new Error('Cannot run tests without author utilities');
}

console.log('✅ Author utilities found, proceeding with tests...');

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  if (runTest(name, fn)) {
    passedTests++;
  }
}

// =============================================================================
// Test 1: Basic String Author Matching
// =============================================================================

test('Legacy string author matching', () => {
  const module = { author: 'rayners' };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'someone-else') === false
  );
});

test('Legacy string author non-match', () => {
  const module = { author: 'different-author' };
  return moduleMatchesAuthor(module, 'rayners') === false;
});

// =============================================================================
// Test 2: Modern Authors Array Matching
// =============================================================================

test('Authors array with name field', () => {
  const module = {
    authors: [
      { name: 'rayners', email: 'rayners@gmail.com' },
      { name: 'collaborator', email: 'collab@example.com' },
    ],
  };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'collaborator') === true &&
    moduleMatchesAuthor(module, 'unknown') === false
  );
});

test('Authors array with github field', () => {
  const module = {
    authors: [{ name: 'David Raynes', github: 'rayners', email: 'rayners@gmail.com' }],
  };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

test('Authors array with email field direct match', () => {
  const module = {
    authors: [{ name: 'David Raynes', email: 'rayners@gmail.com' }],
  };
  return moduleMatchesAuthor(module, 'rayners@gmail.com') === true;
});

test('Authors array with email username extraction', () => {
  const module = {
    authors: [{ name: 'David Raynes', email: 'rayners@gmail.com' }],
  };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

test('Authors array with discord field', () => {
  const module = {
    authors: [{ name: 'David Raynes', discord: 'rayners78' }],
  };
  return moduleMatchesAuthor(module, 'rayners78') === true;
});

test('Authors array with URL field', () => {
  const module = {
    authors: [{ name: 'David Raynes', url: 'https://github.com/rayners' }],
  };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

// =============================================================================
// Test 3: String Authors in Array
// =============================================================================

test('Authors array with string values', () => {
  const module = {
    authors: ['rayners', 'collaborator'],
  };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'collaborator') === true &&
    moduleMatchesAuthor(module, 'unknown') === false
  );
});

test('Mixed string and object authors', () => {
  const module = {
    authors: ['rayners', { name: 'Collaborator', email: 'collab@example.com' }],
  };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'Collaborator') === true &&
    moduleMatchesAuthor(module, 'collab') === true
  );
});

// =============================================================================
// Test 4: Set-based Authors (Foundry Collection)
// =============================================================================

test('Authors as Set collection', () => {
  const authorsSet = new Set([
    { name: 'rayners', email: 'rayners@gmail.com' },
    { name: 'collaborator', email: 'collab@example.com' },
  ]);
  const module = { authors: authorsSet };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'collaborator') === true
  );
});

test('Authors as Set with strings', () => {
  const authorsSet = new Set(['rayners', 'collaborator']);
  const module = { authors: authorsSet };
  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'collaborator') === true
  );
});

// =============================================================================
// Test 5: Edge Cases and Error Handling
// =============================================================================

test('Null module handling', () => {
  return moduleMatchesAuthor(null, 'rayners') === false;
});

test('Undefined module handling', () => {
  return moduleMatchesAuthor(undefined, 'rayners') === false;
});

test('Empty author identifier', () => {
  const module = { author: 'rayners' };
  return (
    moduleMatchesAuthor(module, '') === false &&
    moduleMatchesAuthor(module, null) === false &&
    moduleMatchesAuthor(module, undefined) === false
  );
});

test('Module with no author info', () => {
  const module = { id: 'some-module', version: '1.0.0' };
  return moduleMatchesAuthor(module, 'rayners') === false;
});

test('Empty authors array', () => {
  const module = { authors: [] };
  return moduleMatchesAuthor(module, 'rayners') === false;
});

test('Authors array with null/undefined values', () => {
  const module = { authors: [null, undefined, { name: 'rayners' }] };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

test('Authors array with empty objects', () => {
  const module = { authors: [{}, { name: 'rayners' }] };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

// =============================================================================
// Test 6: Complex Email Patterns
// =============================================================================

test('Complex email domains', () => {
  const module = {
    authors: [{ email: 'rayners@subdomain.company.co.uk' }],
  };
  return moduleMatchesAuthor(module, 'rayners') === true;
});

test('Email with plus addressing', () => {
  const module = {
    authors: [{ email: 'rayners+foundry@gmail.com' }],
  };
  return moduleMatchesAuthor(module, 'rayners+foundry') === true;
});

test('Email with dots in username', () => {
  const module = {
    authors: [{ email: 'david.rayners@example.com' }],
  };
  return moduleMatchesAuthor(module, 'david.rayners') === true;
});

// =============================================================================
// Test 7: URL Pattern Matching
// =============================================================================

test('GitHub URL patterns', () => {
  const testCases = [
    'https://github.com/rayners',
    'http://github.com/rayners',
    'https://www.github.com/rayners',
    'https://github.com/rayners/',
    'https://github.com/rayners/some-repo',
  ];

  return testCases.every(url => {
    const module = { authors: [{ url }] };
    return moduleMatchesAuthor(module, 'rayners');
  });
});

test('Non-GitHub URL handling', () => {
  const module = {
    authors: [{ url: 'https://rayners.dev' }],
  };
  // Should not match since it's not a GitHub URL
  return moduleMatchesAuthor(module, 'rayners') === false;
});

// =============================================================================
// Test 8: Real-World Module Data Simulation
// =============================================================================

test('Seasons & Stars module simulation', () => {
  const module = {
    id: 'seasons-and-stars',
    authors: [
      {
        name: 'David Raynes',
        github: 'rayners',
        email: 'rayners@gmail.com',
        discord: 'rayners78',
        url: 'https://github.com/rayners',
      },
    ],
  };

  return (
    moduleMatchesAuthor(module, 'rayners') === true &&
    moduleMatchesAuthor(module, 'David Raynes') === true &&
    moduleMatchesAuthor(module, 'rayners@gmail.com') === true &&
    moduleMatchesAuthor(module, 'rayners78') === true
  );
});

test('Foundry VTT processed module data', () => {
  // Simulate how Foundry might process module.json data
  const module = {
    id: 'test-module',
    authors: new Set([
      {
        name: 'David Raynes',
        email: 'rayners@gmail.com',
        // github field might be stripped by Foundry
        discord: 'rayners78',
        url: 'https://github.com/rayners',
      },
    ]),
  };

  return moduleMatchesAuthor(module, 'rayners') === true; // Should match via email extraction or URL
});

// =============================================================================
// Test 9: Author Extraction Functions
// =============================================================================

test('extractAuthorNames with object authors', () => {
  const module = {
    authors: [
      { name: 'David Raynes', email: 'rayners@gmail.com' },
      { name: 'Collaborator', github: 'collab' },
    ],
  };
  const names = extractAuthorNames(module);
  return names.length === 2 && names.includes('David Raynes') && names.includes('Collaborator');
});

test('extractAuthorNames preference order', () => {
  const module = {
    authors: [{ name: 'Display Name', github: 'github-user', email: 'user@example.com' }],
  };
  const names = extractAuthorNames(module);
  return names.length === 1 && names[0] === 'Display Name'; // Should prefer name over github/email
});

test('extractAuthorNames with string authors', () => {
  const module = { authors: ['author1', 'author2'] };
  const names = extractAuthorNames(module);
  return names.length === 2 && names.includes('author1') && names.includes('author2');
});

test('getPrimaryAuthorName', () => {
  const module = {
    authors: [{ name: 'Primary Author' }, { name: 'Secondary Author' }],
  };
  return getPrimaryAuthorName(module) === 'Primary Author';
});

test('getFormattedAuthorString', () => {
  const module = {
    authors: [{ name: 'Author One' }, { name: 'Author Two' }],
  };
  return getFormattedAuthorString(module) === 'Author One, Author Two';
});

test('hasAuthorInfo positive', () => {
  const module = { authors: [{ name: 'Someone' }] };
  return hasAuthorInfo(module) === true;
});

test('hasAuthorInfo negative', () => {
  const module = { id: 'some-module' };
  return hasAuthorInfo(module) === false;
});

// =============================================================================
// Test 10: Performance and Memory Tests
// =============================================================================

test('Large authors array performance', () => {
  const startTime = performance.now();

  // Create a large authors array
  const authors = [];
  for (let i = 0; i < 1000; i++) {
    authors.push({ name: `author${i}`, email: `author${i}@example.com` });
  }
  authors.push({ name: 'rayners', email: 'rayners@gmail.com' }); // Target author

  const module = { authors };
  const result = moduleMatchesAuthor(module, 'rayners');

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`  ⏱️ Large array test took ${duration.toFixed(2)}ms`);

  return result === true && duration < 100; // Should complete in under 100ms
});

// =============================================================================
// Summary and Results
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 AUTHOR ATTRIBUTION TEST RESULTS');
console.log('='.repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Author attribution is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Review the output above for details.');
}

// Test with actual Seasons & Stars module if available
console.log('\n🔍 Testing with actual Seasons & Stars module...');
const seasonsStarsModule = game.modules?.get('seasons-and-stars');
if (seasonsStarsModule) {
  console.log('Module found:', {
    id: seasonsStarsModule.id,
    authors: seasonsStarsModule.authors ? Array.from(seasonsStarsModule.authors) : 'none',
  });

  const testResult = moduleMatchesAuthor(seasonsStarsModule, 'rayners');
  console.log(`moduleMatchesAuthor(seasons-and-stars, 'rayners'): ${testResult}`);

  if (testResult) {
    console.log('✅ Real-world test PASSED');
  } else {
    console.log('❌ Real-world test FAILED');
    console.log('Author details:');
    if (seasonsStarsModule.authors) {
      Array.from(seasonsStarsModule.authors).forEach((author, i) => {
        console.log(`  Author ${i}:`, author);
      });
    }
  }
} else {
  console.log('❌ Seasons & Stars module not found for real-world testing');
}

console.log('\n✅ Author attribution testing complete!');
