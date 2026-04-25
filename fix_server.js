const fs = require('fs');
let serverFile = fs.readFileSync('gui/backend/server.js', 'utf8');
serverFile = serverFile.replace(
  "app.post('/api/order/pending', validatePendingOrder, async (req, res) => {",
  "app.post('/api/order/pending', validatePendingOrder, requirePassword, async (req, res) => {"
);
serverFile = serverFile.replace(
  "app.post('/api/order/reasoning', async (req, res) => {",
  "app.post('/api/order/reasoning', requirePassword, async (req, res) => {"
);
fs.writeFileSync('gui/backend/server.js', serverFile);
