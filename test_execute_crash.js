const axios = require('axios');

async function run() {
  try {
    await axios.post('http://127.0.0.1:4000/api/order/execute', {
      exchange: ['binance'], // Make exchange an array to trigger toLowerCase() error
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      amount: 1,
      execute: true
    }, {
      headers: { 'Authorization': 'Bearer admin' }
    });
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
