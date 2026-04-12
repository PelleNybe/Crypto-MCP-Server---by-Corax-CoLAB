/**
 * CORS Logic Verification Test
 * This test extracts the CORS logic from server.js and verifies it behaves as expected.
 */

function createCorsOriginChecker(allowedOrigins) {
  return function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
}

const testCases = [
  {
    allowed: 'http://localhost:5173,http://localhost:4000',
    tests: [
      { origin: 'http://localhost:5173', expected: true },
      { origin: 'http://localhost:4000', expected: true },
      { origin: 'http://malicious.com', expected: false },
      { origin: null, expected: true }
    ]
  },
  {
    allowed: '*',
    tests: [
      { origin: 'http://anything.com', expected: true },
      { origin: 'http://malicious.com', expected: true },
      { origin: null, expected: true }
    ]
  },
  {
    allowed: '', // Default case
    tests: [
      { origin: 'http://localhost:5173', expected: true },
      { origin: 'http://127.0.0.1:5173', expected: true },
      { origin: 'http://localhost:4000', expected: true },
      { origin: 'http://127.0.0.1:4000', expected: true },
      { origin: 'http://localhost', expected: true },
      { origin: 'http://malicious.com', expected: false },
      { origin: null, expected: true }
    ]
  }
];

console.log('Running CORS Logic Tests...');
let totalTests = 0;
let passedTests = 0;

testCases.forEach((tcGroup, groupIndex) => {
  const allowedOrigins = tcGroup.allowed
    ? tcGroup.allowed.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost'];

  const checkOrigin = createCorsOriginChecker(allowedOrigins);

  tcGroup.tests.forEach((t, testIndex) => {
    totalTests++;
    let resultOk = false;
    let resultError = null;

    checkOrigin(t.origin, (err, allow) => {
      if (err) {
        resultOk = false;
        resultError = err.message;
      } else {
        resultOk = !!allow;
      }
    });

    if (resultOk === t.expected) {
      console.log(`Group ${groupIndex} Test ${testIndex}: PASSED (Origin: ${t.origin})`);
      passedTests++;
    } else {
      console.log(`Group ${groupIndex} Test ${testIndex}: FAILED (Origin: ${t.origin}, Expected: ${t.expected}, Got: ${resultOk}, Error: ${resultError})`);
    }
  });
});

console.log(`\nTests passed: ${passedTests}/${totalTests}`);
if (passedTests === totalTests) {
  console.log('All CORS logic tests passed!');
  process.exit(0);
} else {
  console.log('Some tests failed.');
  process.exit(1);
}
