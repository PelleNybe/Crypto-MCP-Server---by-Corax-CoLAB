const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data
      }));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runTest() {
  const PORT = 4001;
  const ALLOWED_ORIGIN = 'http://trusted-origin.com';
  const DISALLOWED_ORIGIN = 'http://malicious-origin.com';

  console.log('Starting backend server for CORS test...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '../gui/backend'),
    env: {
      ...process.env,
      PORT: PORT.toString(),
      DASHBOARD_PASSWORD: 'testpassword',
      ALLOWED_ORIGINS: ALLOWED_ORIGIN,
      MCP_CCXT: 'http://127.0.0.1:7001/mcp', // Mock/Dummy
    }
  });

  // serverProcess.stdout.on('data', (data) => console.log(`Server: ${data}`));
  // serverProcess.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  let success = true;

  try {
    console.log(`Testing allowed origin: ${ALLOWED_ORIGIN}`);
    const resAllowed = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Origin': ALLOWED_ORIGIN }
    });

    if (resAllowed.headers['access-control-allow-origin'] === ALLOWED_ORIGIN) {
      console.log('✅ Allowed origin correctly received Access-Control-Allow-Origin header');
    } else {
      console.error('❌ Allowed origin did NOT receive correct Access-Control-Allow-Origin header');
      console.error('Headers:', resAllowed.headers);
      success = false;
    }

    console.log(`Testing disallowed origin: ${DISALLOWED_ORIGIN}`);
    const resDisallowed = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Origin': DISALLOWED_ORIGIN }
    });

    if (resDisallowed.headers['access-control-allow-origin'] !== DISALLOWED_ORIGIN) {
       console.log('✅ Disallowed origin correctly blocked (Access-Control-Allow-Origin header missing or different)');
    } else {
       console.error('❌ Disallowed origin received Access-Control-Allow-Origin header');
       success = false;
    }

    console.log('Testing no origin...');
    const resNoOrigin = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/orders',
      method: 'GET'
    });
    if (resNoOrigin && resNoOrigin.status === 401) {
        console.log('✅ Request with no origin allowed (received 401 Unauthorized due to missing auth)');
    } else {
        console.log(`Request with no origin returned status: ${resNoOrigin.status}`);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    success = false;
  } finally {
    console.log('Stopping server...');
    serverProcess.kill();
  }

  if (!success) {
    process.exit(1);
  }
  console.log('CORS verification test passed!');
}

runTest();
