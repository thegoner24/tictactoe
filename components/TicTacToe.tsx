"use client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const emptyBoard = Array(9).fill(null);

// --- Types ---
type Mode = "human" | "bot";
type Difficulty = "easy" | "hard";
type WinnerResult = { winner: string; line: number[] } | null;

function calculateWinner(squares: (string | null)[]): WinnerResult {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a]!, line: lines[i] };
    }
  }
  return null;
}

// --- Bot logic ---
function getRandomMove(squares: (string | null)[]): number {
  const empty = squares.map((v, i) => (v === null ? i : null)).filter((v) => v !== null) as number[];
  return empty[Math.floor(Math.random() * empty.length)];
}

function getBestMove(squares: (string | null)[], botMark: string, humanMark: string): number {
  // Minimax algorithm for unbeatable bot
  function minimax(board: (string | null)[], isMax: boolean): { score: number; move: number | null } {
    const result = calculateWinner(board);
    if (result?.winner === botMark) return { score: 1, move: null };
    if (result?.winner === humanMark) return { score: -1, move: null };
    if (board.every(Boolean)) return { score: 0, move: null };
    let best = { score: isMax ? -Infinity : Infinity, move: null as number | null };
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = isMax ? botMark : humanMark;
        const { score } = minimax(board, !isMax);
        board[i] = null;
        if (isMax) {
          if (score > best.score) best = { score, move: i };
        } else {
          if (score < best.score) best = { score, move: i };
        }
      }
    }
    return best;
  }
  return minimax([...squares], true).move ?? getRandomMove(squares);
}

export default function TicTacToe() {
  // --- State ---
  const [history, setHistory] = useState<(string | null)[][]>([[...emptyBoard]]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState<Mode>("human");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [names, setNames] = useState<{ X: string; O: string }>({ X: "Player X", O: "Player O" });
  const [editingNames, setEditingNames] = useState(false);
  const [scores, setScores] = useState<{ X: number; O: number; Draw: number }>({ X: 0, O: 0, Draw: 0 });

  const squares = history[step];
  const winnerResult = calculateWinner(squares);
  const winner = winnerResult?.winner || null;
  const winningLine = winnerResult?.line || [];
  const isLatestStep = step === history.length - 1;
  // Bot should play as O after human (X) in bot mode
  const isBotTurn = mode === "bot" && isLatestStep && !winner && squares.some((s) => s === null) && !xIsNext; // O's turn
  const status = winner
    ? `Winner: ${names[winner as "X" | "O"]}`
    : squares.every(Boolean)
    ? "Draw!"
    : `Next: ${xIsNext ? names.X : mode === "bot" ? "Bot (O)" : names.O}`;

  // --- Handlers ---
  function handleClick(i: number) {
    if (squares[i] || winner) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    const nextHistory = history.slice(0, step + 1).concat([nextSquares]);
    setHistory(nextHistory);
    setStep(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function handleReset() {
    setHistory([[...emptyBoard]]);
    setStep(0);
    setXIsNext(true); // Always start with X (human)
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setHistory([[...emptyBoard]]);
    setStep(0);
    setXIsNext(true); // Always start with X (human)
  }

  function handleDifficultyChange(newDiff: Difficulty) {
    setDifficulty(newDiff);
    handleReset();
  }

  function jumpTo(move: number) {
    setStep(move);
    setXIsNext(move % 2 === 0);
  }

  function handleNameChange(mark: "X" | "O", value: string) {
    setNames((prev) => ({ ...prev, [mark]: value }));
  }

  // --- Bot move effect ---
  useEffect(() => {
    if (isBotTurn) {
      const makeMove = () => {
        // Simple bot: pick a random empty cell
        const empty = squares.map((v, i) => (v === null ? i : null)).filter((v) => v !== null) as number[];
        if (empty.length === 0) return;
        const move = empty[Math.floor(Math.random() * empty.length)];
        handleClick(move);
      };
      const timeout = setTimeout(makeMove, 600);
      return () => clearTimeout(timeout);
    }
  }, [isBotTurn, squares]);

  // --- Score tracking effect ---
  useEffect(() => {
    if (winner) {
      setScores((prev) => ({ ...prev, [winner]: prev[winner as "X" | "O"] + 1 }));
    } else if (squares.every(Boolean) && !winner) {
      setScores((prev) => ({ ...prev, Draw: prev.Draw + 1 }));
    }
    // eslint-disable-next-line
  }, [winner, step]);

  // --- UI ---
  return (
    <div className="relative min-h-[100vh] w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Vibrant Gradient Background */}
      <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-indigo-500 via-sky-400 to-pink-400 opacity-80 blur-2xl" />
      {/* Confetti on Win */}
      {winner && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* Simple confetti using emoji (for demo) */}
          <div className="absolute w-full h-full flex flex-wrap justify-center items-start text-5xl animate-confetti">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, position: 'absolute', animationDelay: `${Math.random()}s` }}>
                🎉
              </span>
            ))}
          </div>
        </div>
      )}
      <Card className="relative z-10 p-10 max-w-xl w-full mx-auto shadow-2xl flex flex-col items-center backdrop-blur-2xl bg-white/60 dark:bg-black/70 border-0 ring-1 ring-white/40 dark:ring-black/40 rounded-3xl">
        <h2 className="text-4xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-indigo-600 via-pink-500 to-sky-400 text-transparent bg-clip-text drop-shadow-2xl animate-gradient-text">
          Tic Tac Toe
        </h2>
        {/* Player Names & Edit */}
        <div className="flex items-center gap-4 mb-4">
          <span className="flex flex-col items-center">
            <span className="font-bold text-indigo-600">X</span>
            {editingNames ? (
              <input
                className="px-2 py-1 rounded bg-white/80 dark:bg-black/30 border border-indigo-300 dark:border-indigo-700 text-xs text-center"
                value={names.X}
                onChange={e => handleNameChange("X", e.target.value)}
                maxLength={12}
              />
            ) : (
              <span className="text-xs font-semibold">{names.X}</span>
            )}
          </span>
          <span className="flex flex-col items-center">
            <span className="font-bold text-pink-500">O</span>
            {editingNames ? (
              <input
                className="px-2 py-1 rounded bg-white/80 dark:bg-black/30 border border-pink-300 dark:border-pink-700 text-xs text-center"
                value={names.O}
                onChange={e => handleNameChange("O", e.target.value)}
                maxLength={12}
              />
            ) : (
              <span className="text-xs font-semibold">{names.O}</span>
            )}
          </span>
          <Button
            size="sm"
            variant={editingNames ? "secondary" : "outline"}
            className="ml-2 px-3 py-1 text-xs rounded-full"
            onClick={() => setEditingNames(e => !e)}
          >
            {editingNames ? "Save" : "Edit Names"}
          </Button>
        </div>
        {/* Mode */}
        <div className="flex flex-wrap gap-2 mb-6 mt-2 items-center justify-center">
          <Button
            variant={mode === "human" ? "default" : "outline"}
            onClick={() => handleModeChange("human")}
            disabled={mode === "human"}
            className="transition-all duration-200 shadow-lg px-6 py-2 rounded-full font-semibold"
          >
            vs Human
          </Button>
          <Button
            variant={mode === "bot" ? "default" : "outline"}
            onClick={() => handleModeChange("bot")}
            disabled={mode === "bot"}
            className="transition-all duration-200 shadow-lg px-6 py-2 rounded-full font-semibold"
          >
            vs Bot
          </Button>
        </div>
        {/* Animated Winning Emoji */}
        {(winner || squares.every(Boolean)) && (
          <div className="flex flex-col items-center mb-4 animate-bounce-in">
            <span
              className="text-7xl drop-shadow-2xl animate-emoji-bounce"
              role="img"
              aria-label={winner ? (winner === 'X' ? 'Trophy' : 'Sparkle') : 'Party'}
              style={{ animation: 'emoji-bounce 1.2s ease-in-out, pulse 1.5s infinite alternate' }}
            >
              {winner ? (winner === 'X' ? '🏆' : '✨') : '🎉'}
            </span>
            <span className="text-lg font-bold mt-2 bg-gradient-to-r from-indigo-500 to-pink-400 bg-clip-text text-transparent animate-fade-in">
              {winner ? `${names[winner as 'X' | 'O']} Wins!` : 'It’s a Draw!'}
            </span>
          </div>
        )}
        {/* Board */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {squares.map((square, i) => (
            <Button
              key={i}
              variant="outline"
              className={`w-24 h-24 text-5xl font-black rounded-3xl transition-all duration-300 shadow-xl flex items-center justify-center
                ${winningLine.includes(i) ? "bg-gradient-to-br from-pink-400 via-indigo-500 to-sky-400 text-white scale-110 animate-pulse ring-4 ring-pink-300/60" : "bg-white/80 dark:bg-black/30 hover:scale-105 hover:shadow-2xl hover:bg-gradient-to-br hover:from-indigo-100 hover:to-pink-100 dark:hover:bg-sky-900/40"}
                ${Boolean(square) || Boolean(winner) || (mode === "bot" && !xIsNext) ? "cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => handleClick(i)}
              disabled={Boolean(square) || Boolean(winner) || (mode === "bot" && !xIsNext)}
              style={{ boxShadow: winningLine.includes(i) ? "0 0 24px 8px #f472b6, 0 0 48px 16px #818cf8" : undefined }}
            >
              <span className={`transition-all duration-200 ${square === "X" ? "text-indigo-600 drop-shadow-lg" : square === "O" ? "text-pink-500 drop-shadow-lg" : ""}`}>{square}</span>
            </Button>
          ))}
        </div>
        {/* Move History */}
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {history.map((_, move) => (
            <Button
              key={move}
              size="sm"
              variant={move === step ? "default" : "outline"}
              className="px-3 py-1 text-xs rounded-full"
              onClick={() => jumpTo(move)}
              disabled={move === step}
            >
              {move === 0 ? "Start" : `Move #${move}`}
            </Button>
          ))}
        </div>
        <div className="mb-4 font-bold text-lg tracking-wide text-gray-800 dark:text-gray-100 drop-shadow-sm">
          {status}
        </div>
        {/* Scoreboard */}
        <div className="mb-4 flex gap-4 justify-center w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-indigo-600">{names.X}</span>
            <span className="text-lg font-extrabold">{scores.X}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-pink-500">{names.O}</span>
            <span className="text-lg font-extrabold">{scores.O}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-gray-500">Draw</span>
            <span className="text-lg font-extrabold">{scores.Draw}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleReset}
          className="mt-2 px-8 py-2 rounded-full font-semibold shadow-lg bg-gradient-to-r from-indigo-400 to-pink-400 text-white hover:from-pink-400 hover:to-indigo-400"
        >
          Reset
        </Button>
      </Card>
    </div>
  );
}
