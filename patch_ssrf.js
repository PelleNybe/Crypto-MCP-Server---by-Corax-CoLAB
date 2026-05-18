const fs = require('fs');

const serverJsPath = 'gui/backend/server.js';
let content = fs.readFileSync(serverJsPath, 'utf8');

const target = `  const mcpUrl = mcpUrls[mcp];
  if (!mcpUrl) return res.status(400).json({ ok: false, error: 'Unknown MCP endpoint' });`;

const replacement = `  if (typeof mcp !== 'string' || !Object.prototype.hasOwnProperty.call(mcpUrls, mcp)) {
    return res.status(400).json({ ok: false, error: 'Unknown MCP endpoint' });
  }
  const mcpUrl = mcpUrls[mcp];
  if (typeof mcpUrl !== 'string') return res.status(400).json({ ok: false, error: 'Invalid MCP endpoint' });`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(serverJsPath, content, 'utf8');
    console.log('Successfully patched server.js');
} else {
    console.log('Target string not found');
}
