import { io } from 'socket.io-client';

// �ڑ���i���[�J���J���ł̓|�[�g4000�j
const socket = io('http://localhost:4001');

export default socket;