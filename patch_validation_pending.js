const fs = require('fs');
const file = 'gui/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const pendingTarget = `  if (numericPrice !== null && (isNaN(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ ok: false, error: 'Price must be a positive number' });
  }`;
const pendingReplacementStr = `  if (numericPrice !== null && (isNaN(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ ok: false, error: 'Price must be a positive number' });
  }
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!allowedSides.includes(side.toLowerCase())) {
      return res.status(400).json({ ok: false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!allowedTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ ok: false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^[A-Z0-9-]+\/[A-Z0-9-]+$/i;
  if (!symbolRegex.test(symbol)) {
      return res.status(400).json({ ok: false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }`;

content = content.replace(pendingTarget, pendingReplacementStr);
fs.writeFileSync(file, content);
