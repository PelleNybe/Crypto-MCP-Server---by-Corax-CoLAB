import { io } from 'socket.io-client';
import { getAuthToken } from './auth';

const socket = io('/', {
  reconnection: true,
  reconnectionDelay: 1000,
  randomizationFactor: 0.5,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 10000,
  auth: {
    token: getAuthToken()
  }
});

// Update token dynamically if connection reconnects
socket.on('reconnect_attempt', () => {
    socket.auth = { token: getAuthToken() };
});

socket.on('connect', () => {
  console.log('[Socket] Connected');
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection Error:', error);
});

export default socket;
