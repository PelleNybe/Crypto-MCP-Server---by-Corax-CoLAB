const fs = require('fs');

let content = fs.readFileSync('gui/backend/server.js', 'utf8');

// There are multiple duplicated blocks. Let's find and remove them.
const pattern = /  const allowedSides = \['buy', 'sell'\];\n  const allowedTypes = \['market', 'limit'\];\n  if \(!allowedSides.includes\(side\.toLowerCase\(\)\)\) {\n      return res\.status\(400\)\.json\({ ok:false, error: 'Invalid order side \(must be buy or sell\)' }\);\n  }\n  if \(!allowedTypes.includes\(type\.toLowerCase\(\)\)\) {\n      return res\.status\(400\)\.json\({ ok:false, error: 'Invalid order type \(must be market or limit\)' }\);\n  }\n  const symbolRegex = \/\^\[A-Z0-9-\]+\\\/\[A-Z0-9-\]+\$\/i;\n  if \(!symbolRegex.test\(symbol\)\) {\n      return res\.status\(400\)\.json\({ ok:false, error: 'Invalid symbol format \(expected e\.g\. BTC\/USDT\)' }\);\n  }\n/g;

// Only keep the first one
let count = 0;
content = content.replace(pattern, (match) => {
    count++;
    if (count === 1) return match;
    return '';
});

// There is also a similar pattern in /api/order/pending
const patternPending = /  const allowedSides = \['buy', 'sell'\];\n  const allowedTypes = \['market', 'limit'\];\n  if \(!allowedSides.includes\(side\.toLowerCase\(\)\)\) {\n      return res\.status\(400\)\.json\({ ok: false, error: 'Invalid order side \(must be buy or sell\)' }\);\n  }\n  if \(!allowedTypes.includes\(type\.toLowerCase\(\)\)\) {\n      return res\.status\(400\)\.json\({ ok: false, error: 'Invalid order type \(must be market or limit\)' }\);\n  }\n  const symbolRegex = \/\^\[A-Z0-9-\]+\\\/\[A-Z0-9-\]+\$\/i;\n  if \(!symbolRegex.test\(symbol\)\) {\n      return res\.status\(400\)\.json\({ ok: false, error: 'Invalid symbol format \(expected e\.g\. BTC\/USDT\)' }\);\n  }\n/g;

count = 0;
content = content.replace(patternPending, (match) => {
    count++;
    if (count === 1) return match;
    return '';
});

fs.writeFileSync('gui/backend/server.js', content);
