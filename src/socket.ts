import { io } from 'socket.io-client';

// 接続先（ローカル開発ではポート4000）
const socket = io('http://localhost:4001');

export default socket;