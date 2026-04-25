const fs = require('fs');
const file = 'gui/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "  )`, (err) => {\n    if (err) console.error('Error creating orders table:', err);\n  });";
const replacementStr = "  )`, (err) => {\n    if (err) console.error('Error creating orders table:', err);\n    db.run('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');\n    db.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');\n  });";

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(file, content);
