const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

// Wait for a port to be ready
function waitForPort(port, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const start = Date.now();
    const interval = setInterval(() => {
      const socket = new net.Socket();
      socket.connect(port, '127.0.0.1', () => {
        socket.destroy();
        clearInterval(interval);
        resolve();
      });
      socket.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for port ${port}`));
        }
      });
    }, 100);
  });
}

async function runTest() {
  console.log('Starting backend server for test...');
  const server = spawn('node', ['server.js'], {
    cwd: 'gui/backend',
    env: { ...process.env, PORT: 4001, DASHBOARD_PASSWORD: 'testpassword' }
  });

  try {
    await waitForPort(4001);
    console.log('Server started.');

    // Test SSRF protection
    try {
        console.log('Testing __proto__ as mcp param...');
        const res = await axios.post('http://127.0.0.1:4001/api/mcp', {
            mcp: '__proto__',
            method: 'test'
        }, {
            headers: { 'Authorization': 'Bearer testpassword' },
            validateStatus: () => true
        });
        assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
        assert.strictEqual(res.data.error, 'Unknown MCP endpoint');
        console.log('Test passed.');
    } catch (e) {
        console.error('Test failed:', e.message);
        process.exitCode = 1;
    }
  } finally {
    server.kill();
  }
}

runTest();
