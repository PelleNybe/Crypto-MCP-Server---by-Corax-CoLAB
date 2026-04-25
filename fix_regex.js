const fs = require('fs');
let code = fs.readFileSync('gui/backend/server.js', 'utf8');

// The original file seems to have duplicated code inside app.post('/api/order/dry_run'
// I'll just remove the duplicate declaration.
code = code.replace(`
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!allowedSides.includes(side.toLowerCase())) {
      return res.status(400).json({ ok:false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!allowedTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ ok:false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^\[A-Z0-9-\]+\\/\[A-Z0-9-\]+$/i;
  if (!symbolRegex.test(symbol)) {
      return res.status(400).json({ ok:false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }
  const allowedSides = ['buy', 'sell'];`, `
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!allowedSides.includes(side.toLowerCase())) {
      return res.status(400).json({ ok:false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!allowedTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ ok:false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^\[A-Z0-9-\]+\\/\[A-Z0-9-\]+$/i;
  if (!symbolRegex.test(symbol)) {
      return res.status(400).json({ ok:false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }
  `);

// Wait, the regex replace earlier might have failed or the duplication is slightly different.
fs.writeFileSync('gui/backend/server.js', code);
