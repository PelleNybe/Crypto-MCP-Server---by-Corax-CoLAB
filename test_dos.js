const axios = require('axios');
async function run() {
  try {
    await axios.post('http://127.0.0.1:4000/api/order/dry_run', {
      exchange: 'binance',
      symbol: 'BTC/USDT',
      side: ['buy', 'sell'], // THIS IS AN ARRAY
      type: 'market',
      amount: 1
    }, {
      headers: {
        'Authorization': 'Bearer admin' // Assuming we can test it like this or without auth to see if it crashes
      }
    });
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
