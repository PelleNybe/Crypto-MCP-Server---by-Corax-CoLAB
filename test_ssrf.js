const req = {
  body: {
    mcp: "toString",
    method: "test",
    params: {}
  }
};

const mcpUrls = {
  MCP_CCXT: 'http://127.0.0.1:7001/mcp'
};

const { mcp, method, params } = req.body;
const mcpUrl = mcpUrls[mcp];

if (mcpUrl && typeof mcpUrl === 'string') {
    console.log("Safe: " + mcpUrl);
} else {
    console.log("Unsafe: " + typeof mcpUrl + " " + String(mcpUrl));
}

// But in server.js
if (!mcpUrl) {
    console.log("Would return 400");
} else {
    console.log("Would pass to callMCP with: " + mcpUrl);
}
