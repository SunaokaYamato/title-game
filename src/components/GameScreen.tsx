import { useState, useEffect } from 'react';
import genres from '../data/genres';
import type { Genre } from '../data/genres';
import socket from '../socket';

type GameScreenProps = {
  playerName: string;
  roomId: string;
  onSubmitTitle: (title: string) => void;
  allPlayers: string[];
  turn: number;
  maxTurns: number;
  submittedTitles: { playerName: string; title: string }[];
};

function GameScreen({
  playerName,
  roomId,
  onSubmitTitle,
  allPlayers,
  turn,
  maxTurns,
  submittedTitles,
}: GameScreenProps) {
  const [genre, setGenre] = useState<Genre | null>(null);
  const [hand, setHand] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [freeword, setFreeword] = useState('');
  const [order, setOrder] = useState<string[]>(['', '', '']);
  const [cardToDiscard, setCardToDiscard] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false); // 🔑 1ターン中1回制限

  const allOptions = [...selected, freeword];
  const submittedPlayers = submittedTitles.map((t) => t.playerName);
  const mySubmittedTitle = submittedTitles.find((t) => t.playerName === playerName)?.title;

  const blankCount = order.filter((val) => val === '').length;
  const filledOrder = order.filter((val) => val !== '');
  const isDuplicate = new Set(filledOrder).size !== filledOrder.length;
  const alreadySubmitted = submittedPlayers.includes(playerName);
  const isFreewordUsedInOrder = order.includes(freeword) && freeword !== '';
  const isFreewordFilled = freeword.trim() !== '';
  const isInvalid =
    blankCount > 1 || isDuplicate || (blankCount === 1 && isFreewordUsedInOrder && !isFreewordFilled);
  const isDisabled = alreadySubmitted || isInvalid || !cardToDiscard || hasSubmitted;

  const displayOptions = allOptions.map((opt) => ({
    value: opt === '' ? '__blank__' : opt,
    label: opt === '' ? '(空白)' : opt,
  }));

  const updateOrder = (index: number, value: string) => {
    const actualValue = value === '__blank__' ? '' : value;
    const newOrder = [...order];
    newOrder[index] = actualValue;
    setOrder(newOrder);
  };

  // ✅ 手札受信（turn に依存しないで常に受け取る）
  useEffect(() => {
    const handleDealHand = (cards: string[]) => {
      console.log('🃏 受け取った手札:', cards);
      setHand(cards);
    };
    socket.on('deal-hand', handleDealHand);
    return () => {
      socket.off('deal-hand', handleDealHand);
    };
  }, []);

  // ✅ ジャンル・UIリセット（毎ターン）
  useEffect(() => {
    const random = genres[Math.floor(Math.random() * genres.length)];
    setGenre(random);
    setSelected([]);
    setFreeword('');
    setOrder(['', '', '']);
    setCardToDiscard(null);
    setHasSubmitted(false); // 🔁 ターン開始時に解除
  }, [turn]);

  const toggleCard = (card: string) => {
    if (selected.includes(card)) {
      setSelected(selected.filter((c) => c !== card));
    } else if (selected.length < 2) {
      setSelected([...selected, card]);
    }
  };

  const makeTitle = () => {
    if (isDisabled) return;
    setHasSubmitted(true);

    const unique = Array.from(new Set(order));
    const title = unique.join('');

    // サーバー送信（App.tsx 側に統一済）
    onSubmitTitle(title);

    socket.emit('submit-title', {
      roomId,
      playerName,
      title,
      usedCards: selected,
    });

    socket.emit('discard-card', { roomId, playerName, card: cardToDiscard });

    // 任意でフィールド初期化
    setSelected([]);
    setFreeword('');
    setOrder(['', '', '']);
    setCardToDiscard(null);
  };

  if (!genre) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">🎲 ジャンルを読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-pink-400 p-6">
      <h2 className="text-xl font-bold text-blue-700">ターン {turn} / {maxTurns}</h2>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">ジャンル：{genre.name}</h2>
        <p className="font-bold mt-2">{genre.description}</p>
      </div>

      {/* 手札 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">手札（2枚まで選択）</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {hand.map((card, idx) => (
            <button
              key={idx}
              onClick={() => toggleCard(card)}
              className={`px-4 py-2 rounded border text-lg transition ${
                selected.includes(card)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-black border-gray-300'
              }`}
            >
              {card}
            </button>
          ))}
        </div>
      </div>

      {/* フリーワード */}
      <div className="mb-4 text-center">
        <label className="block text-gray-700 font-medium mb-1">フリーワード（4文字以内）</label>
        <input
          type="text"
          maxLength={4}
          value={freeword}
          onChange={(e) => setFreeword(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-60 text-center text-lg"
        />
      </div>

      {/* 除外 */}
      <div className="mt-6 text-center bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2 text-gray-800">いらないカードを1枚選んでください</h3>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {hand
            .filter((card) => !selected.includes(card))
            .map((card, idx) => (
              <button
                key={idx}
                onClick={() => setCardToDiscard(card)}
                className={`px-4 py-2 rounded border text-lg ${
                  cardToDiscard === card
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-black border-gray-300'
                }`}
              >
                {card}
              </button>
            ))}
        </div>
        {cardToDiscard === null && <p className="text-red-500 text-sm font-semibold">※ 除外するカードを1枚選んでください</p>}
      </div>

      {/* 並び順 */}
      <div className="mb-4 text-center">
        <h3 className="font-bold mb-2">タイトル順序の指定</h3>
        {[0, 1, 2].map((i) => (
          <select
            key={i}
            value={order[i] === '' ? '__blank__' : order[i]}
            onChange={(e) => updateOrder(i, e.target.value)}
            className="border px-2 py-1 mx-2 rounded"
          >
            <option value="">選択</option>
            {displayOptions.map(({ value, label }, idx) => (
              <option key={`${value}-${idx}`} value={value}>
                {label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* ボタン */}
      <div className="text-center">
        <button
          onClick={makeTitle}
          disabled={isDisabled}
          className={`bg-green-600 text-white px-6 py-2 rounded text-lg transition ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
        >
          タイトルを決定！
        </button>
      </div>

      {/* 自分のタイトル */}
      {mySubmittedTitle && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-bold text-white mb-1">あなたのタイトル</h3>
          <p className="text-xl text-white bg-black/30 inline-block px-4 py-2 rounded">『{mySubmittedTitle}』</p>
        </div>
      )}

      {/* プレイヤー一覧 */}
      {allPlayers.length > 0 && (
        <div className="mt-4 bg-white rounded shadow p-4 max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-2">接続中プレイヤー一覧</h3>
          <ul className="space-y-1">
            {allPlayers.map((name, i) => (
              <li key={i} className="text-gray-800 flex items-center justify-between">
                <span>👤 {name}</span>
                {submittedPlayers.includes(name) && (
                  <span className="text-green-600 font-semibold">✅ 提出済み</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
