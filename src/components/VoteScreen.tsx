import { useState, useEffect } from 'react';
import socket from '../socket';

type PlayerTitle = {
  playerName: string;
  title: string;
};

type VoteScreenProps = {
　roomId: string;
  myName: string;
  titles: PlayerTitle[];
  votes: Record<string, number>;
  votedPlayers: string[];
  readyPlayers: string[];
  onVote: (playerName: string) => void;
  turn: number;
  maxTurns: number;
  allPlayers: string[];
};

function VoteScreen({ roomId,　myName, titles, votes,　votedPlayers, readyPlayers,　onVote, turn, maxTurns ,allPlayers}: VoteScreenProps) {
  const [hasVoted, setHasVoted] = useState(false);

  const vote = (targetName: string) => {
    if (hasVoted) return; // 二重投票防止

    onVote(targetName);
    setHasVoted(true); // ✅ 投票済みに設定
  };

  useEffect(() => {
    socket.on('all-voted', () => {
      // 自分がまだreadyでなければ ready を送信
      socket.emit('ready-for-next-turn', { roomId, playerName: myName });
    });

    return () => {
      socket.off('all-voted'); // クリーンアップ
    };
  }, [turn]);

  return (
    <div className="min-h-screen bg-pink-400 p-6">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">投票フェーズ</h2>
      <h2 className="text-xl font-bold text-blue-700">ターン {turn} / {maxTurns}</h2>
      <ul className="space-y-4 max-w-xl mx-auto">
        {titles.map((entry, index) => (
          <li
            key={index}
            className="bg-white shadow rounded p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{entry.playerName} のタイトル：</p>
              <p className="text-lg">『{entry.title}』</p>
              <p className="text-sm text-gray-600">
                 得票数：{votes[entry.playerName] ?? 0}
              </p>
            </div>
            {entry.playerName !== myName && !hasVoted && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => vote(entry.playerName)}
              >
                投票する
              </button>
            )}

            {entry.playerName !== myName && hasVoted && (
              <span className="text-gray-500">投票済み ✅</span>
            )}
          </li>
        ))}
      </ul>
      {/*次ターン移動処理*/}
      {votedPlayers.includes(myName) && (
        <div className="text-center mt-4">
          {!readyPlayers.includes(myName) ? (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => {
                console.log('🛎️ 次のターン押下！', { roomId, playerName: myName });
                socket.emit('ready-for-next-turn', { roomId, playerName: myName });
              }}
            >
              次のターンへ進む
            </button>
          ) : (
            <p className="text-green-600">✔️ 次のターンを待っています...</p>
          )}
        </div>
      )}
      {/* 接続中プレイヤー一覧（投票状況つき） */}
      {allPlayers.length > 0 && (
        <div className="mt-4 bg-white rounded shadow p-4 max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-2">接続中プレイヤー一覧</h3>
          <ul className="space-y-1">
            {allPlayers.map((name, i) => (
              <li key={i} className="text-gray-800 flex items-center justify-between">
                 <span>👤 {name}</span>
                 {votedPlayers.includes(name) && (
                    <span className="text-green-600 font-semibold">✅ 投票済み</span>
                 )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {allPlayers.length === 1 && (
        <div className="text-center mt-4">
          <button
            onClick={() => socket.emit('ready-for-next-turn', { roomId, playerName: myName })}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            次のターンへ進む
          </button>
        </div>
      )}
    </div>
  );
}

export default VoteScreen;
