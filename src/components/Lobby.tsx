import { useState } from 'react';
import socket from '../socket';

type LobbyProps = {
  onStartGame: (playerName: string, roomId:string) => void;
};

function Lobby({ onStartGame }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('default-room');

  const handleJoin = () => {
    if (!playerName || !roomId) {
      alert('名前とルームIDを入力してください');
      return;
    }

    //socket.emit('join-room', roomId);
    console.log(`🧠 ${playerName} joined ${roomId}`);
    onStartGame(playerName, roomId); // ← roomId も渡すように
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-400 to-pink-400 p-6">
      <h1 className="text-4xl sm:text-5xl font-bold text-blue-800 mb-8 text-center drop-shadow">
        AVタイトル職人 オンライン
      </h1>

      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-5">
        <div>
          <label className="block text-gray-800 font-semibold mb-1">プレイヤー名</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="あなたの名前を入力"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black shadow-inner"
          />
        </div>

        <div>
          <label className="block text-gray-800 font-semibold mb-1">ルームID</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="例: room123"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black shadow-inner"
          />
        </div>

        <button
          onClick={handleJoin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          ルームに参加
        </button>
      </div>
    </div>
  );
}

export default Lobby;