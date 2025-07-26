import { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import VoteScreen from './components/VoteScreen';
import ResultScreen from './components/ResultScreen';
import socket from './socket';

type PlayerTitle = {
  playerName: string;
  title: string;
};

type FinalResults = {
  playerVotes: Record<string, number>;
  allTitles: {
    turn: number;
    playerName: string;
    title: string;
    votes: number;
  }[];
};

function App() {
  const [screen, setScreen] = useState<'lobby' | 'game' | 'vote' | 'result'>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [submittedTitles, setSubmittedTitles] = useState<PlayerTitle[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [votedPlayers, setVotedPlayers] = useState<string[]>([]);
  const [roomId, setRoomId] = useState('');
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [turn, setTurn] = useState(1);
  const maxTurns = 4;
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [finalResults, setFinalResults] = useState<FinalResults | null>(null);

  // ✅ タイトル送信（submit-titleはここだけ！）
  const handleSubmitTitle = (title: string) => {
    socket.emit('submit-title', {
      roomId,
      playerName,
      title,
      usedCards,
    });
  };

  const handleVote = (target: string) => {
    if (votedPlayers.includes(playerName)) return; // 🔒 二重投票防止
    
    setVotes((prev) => ({
      ...prev,
      [target]: (prev[target] || 0) + 1,
    }));
    setVotedPlayers((prev) => [...prev, playerName]);

    socket.emit('vote', {
      roomId,
      playerName,
      targetName: target,
    });
  };

  const handleRestart = () => {
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
    }, 200);

    setScreen('lobby');
    setPlayerName('');
    setSubmittedTitles([]);
    setVotes({});
    setVotedPlayers([]);
    setRoomId('');
    setAllPlayers([]);
    setTurn(1);
    setFinalResults(null);
    setReadyPlayers([]);
  };

  useEffect(() => {
    console.log('🧾 全プレイヤー:', allPlayers);
    console.log('📝 提出済みタイトル:', submittedTitles.map((p) => p.playerName));
  }, [submittedTitles, allPlayers]);

  // 👥 プレイヤー一覧
  useEffect(() => {
    socket.on('players-in-room', (players: string[]) => {
      setAllPlayers(players);
    });

    socket.on('game-over', (results: FinalResults) => {
      console.log('🎉 ゲーム終了 → 最終結果:', results);
      setFinalResults(results);
      setScreen('result');
    });

    return () => {
      socket.off('players-in-room');
      socket.off('game-over');
    };
  }, []);

  // ✅ タイトルが全員揃ったら投票へ
  useEffect(() => {
    if (allPlayers.length > 0 && submittedTitles.length === allPlayers.length) {
      console.log('✅ 全員提出完了！投票画面へ遷移');
      setScreen('vote');
    }
  }, [submittedTitles, allPlayers]);

  useEffect(() => {
    const handleUnload = () => {
      socket.disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // ✅ タイトル受信
  useEffect(() => {
    const handleReceiveTitle = ({ playerName, title }: { playerName: string; title: string }) => {
      console.log('✅ タイトル受信:', playerName, title);
      setSubmittedTitles((prev) =>
        prev.some((pt) => pt.playerName === playerName)
          ? prev
          : [...prev, { playerName, title }]
      );
    };
    socket.on('title-submitted', handleReceiveTitle);
    return () => {
      socket.off('title-submitted', handleReceiveTitle);
    };
  }, []);

  // 🔁 次ターン制御
  useEffect(() => {
    socket.on('player-ready-next', (name: string) => {
      setReadyPlayers((prev) => [...new Set([...prev, name])]);
    });

    socket.on('next-turn', (newTurn: number) => {
      console.log('🔁 次のターンへ:', newTurn);
      setTurn(newTurn);
      setSubmittedTitles([]);
      setVotes({});
      setVotedPlayers([]);
      setReadyPlayers([]);
      setScreen('game');
    });

    return () => {
      socket.off('player-ready-next');
      socket.off('next-turn');
    };
  }, []);

  return (
    <>
      {screen === 'lobby' && (
        <Lobby
          onStartGame={(name: string, roomId: string) => {
            setPlayerName(name);
            setRoomId(roomId);
            socket.emit('join-room', { roomId, playerName: name });
            setScreen('game');
          }}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          playerName={playerName}
          roomId={roomId}
          onSubmitTitle={handleSubmitTitle}
          allPlayers={allPlayers}
          turn={turn}
          maxTurns={maxTurns}
          submittedTitles={submittedTitles}
        />
      )}
      {screen === 'vote' && (
        <VoteScreen
          roomId={roomId}
          myName={playerName}
          titles={submittedTitles}
          votes={votes}
          onVote={handleVote}
          turn={turn}
          maxTurns={maxTurns}
          votedPlayers={votedPlayers}
          readyPlayers={readyPlayers}
          allPlayers={allPlayers}
        />
      )}
      {screen === 'result' && finalResults && (
        <ResultScreen results={finalResults} onRestart={handleRestart} myName={playerName} />
      )}
    </>
  );
}

export default App;
