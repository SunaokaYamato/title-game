import React from 'react';

type FinalResults = {
  playerVotes: Record<string, number>;
  allTitles: {
    turn: number;
    playerName: string;
    title: string;
    votes: number;
  }[];
};

type Props = {
  results: FinalResults;
  onRestart: () => void;
  myName: string;
};

const ResultScreen: React.FC<Props> = ({ results, onRestart }) => {
  const rankedPlayers = Object.entries(results.playerVotes)
    .sort((a, b) => b[1] - a[1])
    .reduce<{ name: string; votes: number; rank: number }[]>((acc, [name, votes], idx) => {
      const prev = acc[idx - 1];
      const rank = prev && prev.votes === votes ? prev.rank : idx + 1;
      acc.push({ name, votes, rank });
      return acc;
    }, []);

  const groupedTitles: Record<string, { turn: number; title: string; votes: number }[]> = {};
  results.allTitles.forEach(({ playerName, turn, title, votes }) => {
    if (!groupedTitles[playerName]) {
      groupedTitles[playerName] = [];
    }
    groupedTitles[playerName].push({ turn, title, votes });
  });

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-center text-green-700">🎉 最終結果 🎉</h2>

      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-3 text-blue-700">🎖️ 得票ランキング</h3>
        <ul className="space-y-4">
          {rankedPlayers.map(({ name, votes, rank }) => (
            <li key={name} className="bg-white p-4 rounded shadow-md">
              <div className="text-lg font-semibold">
                {getMedal(rank)} {rank}位: <span className="text-gray-800">{name}</span>
                <span className="ml-2 text-blue-600 font-bold">（{votes}票）</span>
              </div>
              <ul className="ml-4 mt-2 text-sm text-gray-700 list-disc">
                {groupedTitles[name]?.map((entry, idx) => (
                  <li key={idx}>
                    ターン{entry.turn}：「
                    <span className="text-blue-800 font-semibold">{entry.title}</span>
                    」 → 👍 {entry.votes}票
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-3 text-blue-700">📝 プレイヤー別タイトル一覧</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedTitles).map(([player, titles]) => (
            <div key={player} className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold mb-2 text-lg text-gray-800">{player}の作品一覧</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {titles.map((t, i) => (
                  <li key={i}>
                    ターン{t.turn}：「
                    <span className="text-indigo-700 font-medium">{t.title}</span>
                    」→ 👍 {t.votes}票
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onRestart}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105"
        >
          🔄 最初に戻る
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
