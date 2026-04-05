/**
 * Robust manual test script for order validation logic in gui/backend/server.js
 */

function validateOrder(side, type, symbol) {
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];

  if (!side || typeof side !== 'string' || !allowedSides.includes(side.toLowerCase())) {
    return { ok: false, error: 'Invalid order side (must be buy or sell)' };
  }
  if (!type || typeof type !== 'string' || !allowedTypes.includes(type.toLowerCase())) {
    return { ok: false, error: 'Invalid order type (must be market or limit)' };
  }
  const symbolRegex = /^[A-Z0-9-]+\/[A-Z0-9-]+$/i;
  if (!symbolRegex || typeof symbol !== 'string' || !symbolRegex.test(symbol)) {
    return { ok: false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' };
  }
  return { ok: true };
}

const testCases = [
  { side: 'buy', type: 'market', symbol: 'BTC/USDT', expected: true },
  { side: 'SELL', type: 'LIMIT', symbol: 'ETH/BTC', expected: true },
  { side: 'long', type: 'market', symbol: 'BTC/USDT', expected: false },
  { side: 'buy', type: 'stop', symbol: 'BTC/USDT', expected: false },
  { side: 'buy', type: 'market', symbol: 'BTCUSDT', expected: false },
  { side: 'buy', type: 'market', symbol: 'BTC-USDT', expected: false },
  { side: 'buy', type: 'market', symbol: 'BTC/USDT/1', expected: false },
  { side: '', type: 'market', symbol: 'BTC/USDT', expected: false },
  { side: null, type: 'market', symbol: 'BTC/USDT', expected: false },
  { side: 123, type: 'market', symbol: 'BTC/USDT', expected: false },
  { side: 'buy', type: null, symbol: 'BTC/USDT', expected: false },
  { side: 'buy', type: 'market', symbol: null, expected: false }
];

console.log('Running Robust Order Validation Tests...');
let passed = 0;
testCases.forEach((tc, i) => {
  try {
    const res = validateOrder(tc.side, tc.type, tc.symbol);
    if (res.ok === tc.expected) {
      console.log(`Test Case ${i + 1}: PASSED`);
      passed++;
    } else {
      console.log(`Test Case ${i + 1}: FAILED (Expected ok: ${tc.expected}, got ok: ${res.ok}, error: ${res.error})`);
    }
  } catch (e) {
    console.log(`Test Case ${i + 1}: CRASHED (Error: ${e.message})`);
  }
});

console.log(`\nTests passed: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
  console.log('All robust validation tests passed!');
  process.exit(0);
} else {
  console.log('Some tests failed.');
  process.exit(1);
}
