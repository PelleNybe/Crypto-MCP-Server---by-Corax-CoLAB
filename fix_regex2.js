const fs = require('fs');
let code = fs.readFileSync('gui/backend/server.js', 'utf8');

let fixed = code.replace(/const symbolRegex = \/\^\[A-Z0-9-\]\+\/\[A-Z0-9-\]\+\$\/i;/g, "const symbolRegex = /^[A-Z0-9-]+\\/[A-Z0-9-]+$/i;");
fixed = fixed.replace(/const allowedSides = \['buy', 'sell'\];\n  const allowedTypes = \['market', 'limit'\];\n  if \(\!allowedSides\.includes\(side\.toLowerCase\(\)\)\) \{\n      return res\.status\(400\)\.json\(\{ ok:false, error: 'Invalid order side \(must be buy or sell\)' \}\);\n  \}\n  if \(\!allowedTypes\.includes\(type\.toLowerCase\(\)\)\) \{\n      return res\.status\(400\)\.json\(\{ ok:false, error: 'Invalid order type \(must be market or limit\)' \}\);\n  \}\n  const symbolRegex = \/\^\[A-Z0-9-\]\+\\\\/\[A-Z0-9-\]\+\$\/i;\n  if \(\!symbolRegex\.test\(symbol\)\) \{\n      return res\.status\(400\)\.json\(\{ ok:false, error: 'Invalid symbol format \(expected e\.g\. BTC\/USDT\)' \}\);\n  \}\n  const allowedSides = \['buy', 'sell'\];/g, "const allowedSides = ['buy', 'sell'];");

fs.writeFileSync('gui/backend/server.js', fixed);
