const req = {
  body: {
    mcp: "__proto__",
    method: "test",
    params: {}
  }
};

const mcpUrls = {
  MCP_CCXT: 'http://127.0.0.1:7001/mcp'
};

const { mcp, method, params } = req.body;

if (typeof mcp !== 'string' || !mcpUrls.hasOwnProperty(mcp)) {
    console.log("Validation failed");
} else {
    console.log("Validation passed");
}
