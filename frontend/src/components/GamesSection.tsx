import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, ArrowLeft, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { speechService } from '../services/speechService';

interface GamesSectionProps {
  focusedIndex: number;
  triggerSelect: boolean;
  onSelectHandled: () => void;
  activeItemCount: (count: number) => void;
  lastGesture: string | null;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  focusedIndex,
  triggerSelect,
  onSelectHandled,
  activeItemCount,
  lastGesture
}) => {
  const [activeGame, setActiveGame] = useState<'menu' | 'pong' | 'memory' | 'runner'>('menu');

  useEffect(() => {
    if (activeGame === 'menu') {
      activeItemCount(3);
    }
  }, [activeGame, activeItemCount]);

  useEffect(() => {
    if (!triggerSelect) return;

    if (activeGame === 'menu') {
      if (focusedIndex === 0) {
        setActiveGame('pong');
        speechService.speak('Starting Saccadic Pong.');
      } else if (focusedIndex === 1) {
        setActiveGame('memory');
        speechService.speak('Starting Card Memory Matrix.');
      } else if (focusedIndex === 2) {
        setActiveGame('runner');
        speechService.speak('Starting Reflex Lane Pilot.');
      }
    }

    onSelectHandled();
  }, [triggerSelect, activeGame, focusedIndex]);

  return (
    <div className="w-full flex flex-col h-full gap-4">
      {/* Header / Game Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {activeGame !== 'menu' && (
            <button
              onClick={() => setActiveGame('menu')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 text-sm font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Exit to Therapy Menu
            </button>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-main flex items-center gap-2.5 text-white">
              <Brain className="text-blue-500" size={24} />
              {activeGame === 'menu' && 'Ocular Tracking & Cognitive Therapy'}
              {activeGame === 'pong' && 'Saccadic Tracking Pong'}
              {activeGame === 'memory' && 'Visual Memory Matrix'}
              {activeGame === 'runner' && 'Reflex Gaze Pilot'}
            </h2>
            <p className="text-xs text-slate-400 text-white">
              {activeGame === 'menu'
                ? 'Clinical neuro-assistive exercises designed to maintain eye muscle coordination and cognitive stimulation'
                : 'Controlled via horizontal eye saccades (Left / Right) and blinks'}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700 font-mono hidden sm:block">
          Gaze Tracker Active
        </div>
      </div>

      {/* Game Menu Selection */}
      {activeGame === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
          {/* Pong Card */}
          <div
            onClick={() => setActiveGame('pong')}
            className={`
              aac-card p-6 flex flex-col items-center text-center cursor-pointer justify-between
              ${focusedIndex === 0 ? 'eye-focus-active' : ''}
            `}
          >
            {focusedIndex === 0 && (
              <div className="assistive-focus-badge">Triple-Blink to Play</div>
            )}
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center text-4xl mb-4">
              🏓
            </div>
            <h3 className="text-xl font-bold text-main mb-2">Saccadic Pong</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Track the ball and shift paddle between left and right gaze. Strengthens ocular saccade motor control and reaction speed.
            </p>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
              Left / Right Eye Saccades
            </span>
          </div>

          {/* Memory Match Card */}
          <div
            onClick={() => setActiveGame('memory')}
            className={`
              aac-card p-6 flex flex-col items-center text-center cursor-pointer justify-between
              ${focusedIndex === 1 ? 'eye-focus-active' : ''}
            `}
          >
            {focusedIndex === 1 && (
              <div className="assistive-focus-badge">Triple-Blink to Play</div>
            )}
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center text-4xl mb-4">
              🧠
            </div>
            <h3 className="text-xl font-bold text-main mb-2">Visual Memory Matrix</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Scan across hidden symbols with gaze and triple-blink to reveal matching pairs. Enhances short-term recall and attention.
            </p>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
              Gaze + Triple-Blink Flip
            </span>
          </div>

          {/* Lane Runner Card */}
          <div
            onClick={() => setActiveGame('runner')}
            className={`
              aac-card p-6 flex flex-col items-center text-center cursor-pointer justify-between
              ${focusedIndex === 2 ? 'eye-focus-active' : ''}
            `}
          >
            {focusedIndex === 2 && (
              <div className="assistive-focus-badge">Triple-Blink to Play</div>
            )}
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-4xl mb-4">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-main mb-2">Reflex Gaze Pilot</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Navigate your marker through three designated lanes using rapid eye gaze switches to collect targets.
            </p>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
              Fast Gaze Switching
            </span>
          </div>
        </div>
      )}

      {/* GAME 1: EYE PONG */}
      {activeGame === 'pong' && (
        <EyePongGame 
          lastGesture={lastGesture} 
          activeItemCount={activeItemCount} 
        />
      )}

      {/* GAME 2: CARD MEMORY */}
      {activeGame === 'memory' && (
        <CardMemoryGame
          focusedIndex={focusedIndex}
          triggerSelect={triggerSelect}
          onSelectHandled={onSelectHandled}
          activeItemCount={activeItemCount}
        />
      )}

      {/* GAME 3: LANE RUNNER */}
      {activeGame === 'runner' && (
        <LaneRunnerGame 
          lastGesture={lastGesture} 
          activeItemCount={activeItemCount} 
        />
      )}
    </div>
  );
};

// ========================================================
// SUB-GAME 1: EYE PONG (With Eye-Gaze Restart Support)
// ========================================================
const EyePongGame: React.FC<{ 
  lastGesture: string | null; 
  activeItemCount: (count: number) => void;
}> = ({ lastGesture, activeItemCount }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  useEffect(() => {
    activeItemCount(1);
  }, [activeItemCount]);

  const stateRef = useRef({
    paddleX: 250,
    paddleWidth: 100,
    ballX: 300,
    ballY: 150,
    ballSpeedX: 3.5,
    ballSpeedY: -3.5,
    score: 0,
    isPlaying: true
  });

  const restart = () => {
    stateRef.current = {
      paddleX: 250,
      paddleWidth: 100,
      ballX: 300,
      ballY: 150,
      ballSpeedX: (Math.random() > 0.5 ? 1 : -1) * 3.5,
      ballSpeedY: -3.5,
      score: 0,
      isPlaying: true
    };
    setScore(0);
    setGameOver(false);
    speechService.playSelectionTone();
  };

  // Eye movement & Eye-Gaze Restart Handler
  useEffect(() => {
    if (!lastGesture) return;

    if (gameOver) {
      if (lastGesture === 'TRIPLE_BLINK' || lastGesture === 'DOUBLE_BLINK') {
        restart();
      }
      return;
    }

    const s = stateRef.current;
    if (lastGesture === 'LOOK_LEFT') {
      s.paddleX = Math.max(10, s.paddleX - 55);
      speechService.playTone(350, 0.04);
    } else if (lastGesture === 'LOOK_RIGHT') {
      s.paddleX = Math.min(600 - s.paddleWidth - 10, s.paddleX + 55);
      speechService.playTone(450, 0.04);
    }
  }, [lastGesture, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      if (s.isPlaying) {
        s.ballX += s.ballSpeedX;
        s.ballY += s.ballSpeedY;

        // Bounce left / right walls
        if (s.ballX - 10 <= 0 || s.ballX + 10 >= 600) {
          s.ballSpeedX = -s.ballSpeedX;
          speechService.playTone(280, 0.03);
        }
        // Bounce ceiling
        if (s.ballY - 10 <= 0) {
          s.ballSpeedY = -s.ballSpeedY;
          speechService.playTone(320, 0.03);
        }

        // Paddle collision
        const paddleY = 360;
        if (
          s.ballY + 10 >= paddleY &&
          s.ballY - 10 <= paddleY + 14 &&
          s.ballX >= s.paddleX &&
          s.ballX <= s.paddleX + s.paddleWidth
        ) {
          s.ballSpeedY = -Math.abs(s.ballSpeedY) * 1.04;
          s.ballSpeedX *= 1.02;
          s.score += 1;
          setScore(s.score);
          speechService.playTone(600, 0.06);

          if (s.score % 5 === 0) {
            confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
          }
        }

        // Missed bottom
        if (s.ballY > 400) {
          s.isPlaying = false;
          setGameOver(true);
          speechService.playTone(180, 0.25, 'sawtooth');
          setHighScore(prev => Math.max(prev, s.score));
        }
      }

      // Draw Court (High-contrast charcoal slate)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 400);

      // Center dashed net
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(600, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Paddle
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(s.paddleX, 360, s.paddleWidth, 14, 6);
      ctx.fill();

      // Draw Ball
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 9, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3">
      <div className="flex items-center justify-between w-full max-w-[600px] px-2 text-slate-300 font-mono text-sm">
        <span className="font-bold text-blue-400">Rebounds: {score}</span>
        <span className="font-bold text-amber-400">Best Session: {highScore}</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
        <canvas ref={canvasRef} width={600} height={400} className="w-full max-w-[600px] h-auto block bg-slate-900" />

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
            <h3 className="text-2xl font-bold text-white">Session Complete</h3>
            <p className="text-slate-300 font-mono text-sm">Score: {score} successful rebounds</p>
            <button
              onClick={restart}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-md transition-colors"
            >
              <RotateCcw size={16} /> Play Again [Triple-Blink]
            </button>
            <span className="text-xs text-slate-400 font-mono mt-1">
              (Eye-Gaze: Triple-Blink or press [3] / Enter to restart)
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 font-medium">
        👀 Look Left / Right to position paddle.
      </p>
    </div>
  );
};

// ========================================================
// SUB-GAME 2: CARD MEMORY (With Completion Screen)
// ========================================================
interface CardItem {
  id: number;
  symbol: string;
  matched: boolean;
}

const SYMBOLS = ['🌟', '🍎', '💎', '🔔'];

const CardMemoryGame: React.FC<{
  focusedIndex: number;
  triggerSelect: boolean;
  onSelectHandled: () => void;
  activeItemCount: (count: number) => void;
}> = ({ focusedIndex, triggerSelect, onSelectHandled, activeItemCount }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(0);

  const initCards = () => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({ id: idx, symbol: sym, matched: false }));
    setCards(deck);
    setFlippedIndices([]);
    setMatchesCount(0);
  };

  useEffect(() => {
    initCards();
  }, []);

  useEffect(() => {
    activeItemCount(8);
  }, [activeItemCount]);

  useEffect(() => {
    if (!triggerSelect) return;

    if (matchesCount === 4) {
      initCards();
    } else {
      handleCardFlip(focusedIndex);
    }
    onSelectHandled();
  }, [triggerSelect, focusedIndex, matchesCount]);

  const handleCardFlip = (index: number) => {
    if (cards[index]?.matched) return;
    if (flippedIndices.includes(index)) return;
    if (flippedIndices.length >= 2) return;

    speechService.playSelectionTone();
    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === first || i === second ? { ...c, matched: true } : c));
          setFlippedIndices([]);
          setMatchesCount(m => {
            const newM = m + 1;
            if (newM === 4) {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              speechService.speak('Excellent! All pairs matched.');
            } else {
              speechService.speak('Match found!');
            }
            return newM;
          });
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          speechService.playTone(220, 0.15, 'sawtooth');
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] text-slate-300 font-semibold text-sm">
        <span className="text-purple-400">Completed: {matchesCount} / 4 Pairs</span>
        <button
          onClick={initCards}
          className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw size={14} /> Reset Board
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3.5 w-full max-w-[600px]">
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx) || card.matched;
          const isFocused = focusedIndex === idx;

          return (
            <div
              key={card.id}
              onClick={() => handleCardFlip(idx)}
              className={`
                aspect-square rounded-xl flex items-center justify-center text-3xl select-none cursor-pointer
                transition-all duration-200 border-2
                ${isFocused ? 'eye-focus-active' : 'border-slate-700/70'}
                ${card.matched ? 'bg-emerald-950/40 border-emerald-500/60' : isFlipped ? 'bg-purple-950/50' : 'bg-slate-900 hover:bg-slate-800'}
              `}
            >
              {isFlipped ? card.symbol : '◻️'}
            </div>
          );
        })}
      </div>

      {matchesCount === 4 ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <span>Board Solved! Triple-Blink or click Reset to generate a new layout.</span>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          👀 Scan Left / Right across cards • Triple-Blink to reveal.
        </p>
      )}
    </div>
  );
};

// ========================================================
// SUB-GAME 3: LANE RUNNER (With Eye-Gaze Controls)
// ========================================================
const LaneRunnerGame: React.FC<{ 
  lastGesture: string | null;
  activeItemCount: (count: number) => void;
}> = ({ lastGesture, activeItemCount }) => {
  const [lane, setLane] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [stars, setStars] = useState<{ id: number; lane: number; y: number }[]>([]);

  useEffect(() => {
    activeItemCount(1);
  }, [activeItemCount]);

  useEffect(() => {
    if (!lastGesture) return;
    if (lastGesture === 'LOOK_LEFT') {
      setLane(prev => Math.max(0, prev - 1));
      speechService.playTone(400, 0.04);
    } else if (lastGesture === 'LOOK_RIGHT') {
      setLane(prev => Math.min(2, prev + 1));
      speechService.playTone(500, 0.04);
    }
  }, [lastGesture]);

  useEffect(() => {
    let nextId = 0;
    const interval = setInterval(() => {
      setStars(prev => [
        ...prev.map(s => ({ ...s, y: s.y + 12 })),
        ...(Math.random() > 0.4 ? [{ id: nextId++, lane: Math.floor(Math.random() * 3), y: 0 }] : [])
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setStars(prev => {
      const remaining: typeof prev = [];
      prev.forEach(star => {
        if (star.y >= 260 && star.y <= 310 && star.lane === lane) {
          setScore(s => s + 10);
          speechService.playTone(650, 0.05);
        } else if (star.y < 340) {
          remaining.push(star);
        }
      });
      return remaining;
    });
  }, [stars, lane]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3">
      <div className="flex items-center justify-between w-full max-w-[500px] text-slate-300 font-mono text-sm font-semibold">
        <span className="text-emerald-400">Target Score: {score}</span>
        <span className="text-xs text-slate-400 font-sans">Look Left/Right to shift lane</span>
      </div>

      <div className="relative w-full max-w-[500px] h-[340px] rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden flex shadow-lg">
        {[0, 1, 2].map(l => (
          <div key={l} className="flex-1 border-r border-slate-800 last:border-r-0 relative bg-slate-950/40">
            {stars.filter(s => s.lane === l).map(s => (
              <div
                key={s.id}
                className="absolute text-2xl transition-transform"
                style={{ top: `${s.y}px`, left: '38%' }}
              >
                ⭐
              </div>
            ))}

            {lane === l && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-3xl">
                🔷
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
