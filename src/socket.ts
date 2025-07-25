import { io } from 'socket.io-client';

// 👇 Render の URL に置き換え
const socket = io('https://title-game-server.onrender.com', {
  transports: ['websocket'],
});

export default socket;
