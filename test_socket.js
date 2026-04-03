const io = require('socket.io-client');
const socket = io('http://127.0.0.1:4000');
socket.on('connect', () => {
  console.log('Connected to socket!');
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.log('Connection failed:', err.message);
  process.exit(1);
});
setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 2000);
