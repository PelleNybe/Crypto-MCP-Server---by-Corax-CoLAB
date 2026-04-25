const axios = require('axios');
async function run() {
  try {
    const response = await axios.get('http://127.0.0.1:4000/api/portfolio?exchanges=binance&exchanges=kraken', {
      headers: {
        'Authorization': 'Bearer admin' // Replace with your auth mechanism if needed
      }
    });
    console.log(response.status, response.data);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
