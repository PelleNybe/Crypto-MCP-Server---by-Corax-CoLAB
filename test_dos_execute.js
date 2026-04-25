const http = require('http');

const data = JSON.stringify({
  exchange: ['binance'],
  symbol: 'BTC/USDT',
  side: 'buy',
  type: 'market',
  amount: 1,
  execute: true
});

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/order/execute',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer admin'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
