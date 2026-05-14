import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, HelpCircle, Gamepad2, Play, Pause, RotateCcw } from 'lucide-react';
import { useTetris } from './hooks/useTetris';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES } from './constants';
import { sound } from './lib/sound';
import { Board } from './components/Board';

// --- UI Components ---

const GlossyPanel: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`relative bg-[#1A1A1A] border-[6px] border-[#999] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_2px_2px_10px_rgba(255,255,255,0.1)] overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {title && (
      <div className="bg-[#111] border-b-2 border-[#333] py-2 px-4 shadow-md">
        <div className="text-[#eee] text-sm font-black tracking-[0.2em] text-center uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          {title}
        </div>
      </div>
    )}
    <div className="p-3 flex flex-col items-center justify-center min-h-[80px] relative z-10">
      {children}
    </div>
  </div>
);

const LCDDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="w-full mb-4">
    <div className="text-[#eee] text-[12px] font-black uppercase mb-1 tracking-widest text-center drop-shadow-[0_1px_1px_black]">{label}</div>
    <div className="bg-[#050505] border-[3px] border-[#333] rounded-xl p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,1)]">
      <div className="text-white font-mono text-2xl text-center font-bold tracking-normal">
        {value.toLocaleString()}
      </div>
    </div>
  </div>
);

const PiecePreview: React.FC<{ type: string | null }> = ({ type }) => {
  if (!type) return <div className="w-24 h-24 bg-[#0a0a0a] rounded-xl mb-4" />;
  
  const shape = SHAPES[type as keyof typeof SHAPES];
  const grid = shape.shapes[0];
  const color = shape.color;

  return (
    <div className="relative w-24 h-24 bg-[#0a0a0a] rounded-xl flex items-center justify-center p-2 mb-4 border border-white/5">
      {/* Visual background for the preview box */}
      <div className="grid grid-cols-4 grid-rows-4 gap-1 transform scale-90">
        {Array.from({ length: 4 }).map((_, y) => 
          Array.from({ length: 4 }).map((_, x) => {
            const isFilled = grid.some(p => p.x === x && p.y === y);
            return (
              <div 
                key={`${x}-${y}`} 
                className={`w-4 h-4 rounded-sm transition-all duration-300 ${isFilled ? 'shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),2px_2px_4px_rgba(0,0,0,0.5)]' : 'bg-white/5'}`}
                style={{ backgroundColor: isFilled ? color : '' }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

/** 
 * Tetris Ultimate Entry Point
 * Handles game modes, global keyboard listeners, and shared high scores.
 */
type GameMode = 'MENU' | 'SOLO' | 'BATTLE' | 'SPRINT';

export default function App() {
  const [mode, setMode] = React.useState<GameMode>('MENU');
  
  // Solo Mode State
  const solo = useTetris();
  
  // Battle Mode State
  const p1 = useTetris((garbage) => p2.addGarbage(garbage));
  const p2 = useTetris((garbage) => p1.addGarbage(garbage));

  // Sprint Mode State
  const sprint = useTetris();
  const [sprintTime, setSprintTime] = React.useState(0);
  const [sprintLeaderboard, setSprintLeaderboard] = React.useState<number[]>([]);

  const [highScores, setHighScores] = React.useState<number[]>([]);
  const [isShaking, setIsShaking] = React.useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sound.init();

      const activeHook = mode === 'SOLO' ? solo : mode === 'SPRINT' ? sprint : null;
      if (activeHook) {
        if (activeHook.state.isGameOver) return;
        switch (e.key) {
          case 'ArrowLeft': activeHook.move(-1, 0); sound.playMove(); break;
          case 'ArrowRight': activeHook.move(1, 0); sound.playMove(); break;
          case 'ArrowDown': activeHook.move(0, 1); sound.playMove(); break;
          case 'ArrowUp': activeHook.rotate(1); sound.playRotate(); break;
          case 'z': activeHook.rotate(-1); sound.playRotate(); break;
          case ' ': activeHook.hardDrop(); sound.playLock(); setIsShaking(true); setTimeout(() => setIsShaking(false), 100); break;
          case 'c': activeHook.hold(); break;
          case 'Escape': activeHook.pause(); break;
        }
      }

      if (mode === 'BATTLE') {
        // Player 1: WASD + Space
        if (!p1.state.isGameOver && !p1.state.isPaused) {
          switch (e.key) {
            case 'a': p1.move(-1, 0); break;
            case 'd': p1.move(1, 0); break;
            case 's': p1.move(0, 1); break;
            case 'w': p1.rotate(1); break;
            case 'q': p1.rotate(-1); break;
            case ' ': p1.hardDrop(); break;
            case 'Shift': p1.hold(); break;
          }
        }
        // Player 2: Arrow Keys + Enter
        if (!p2.state.isGameOver && !p2.state.isPaused) {
          switch (e.key) {
            case 'ArrowLeft': p2.move(-1, 0); break;
            case 'ArrowRight': p2.move(1, 0); break;
            case 'ArrowDown': p2.move(0, 1); break;
            case 'ArrowUp': p2.rotate(1); break;
            case 'm': p2.rotate(-1); break;
            case 'Enter': p2.hardDrop(); break;
            case 'Control': p2.hold(); break;
          }
        }
        if (e.key === 'Escape') {
          p1.pause();
          p2.pause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, solo, p1, p2]);

  useEffect(() => {
    let interval: any;
    if (mode === 'SPRINT' && !sprint.state.isPaused && !sprint.state.isGameOver && sprint.state.lines < 40) {
      interval = setInterval(() => setSprintTime(t => t + 10), 10);
    }
    return () => clearInterval(interval);
  }, [mode, sprint.state.isPaused, sprint.state.isGameOver, sprint.state.lines]);

  // Handle Sprint completion
  useEffect(() => {
    if (mode === 'SPRINT' && sprint.state.lines >= 40) {
      sprint.pause();
      const newScores = [...sprintLeaderboard, sprintTime].sort((a, b) => a - b).slice(0, 5);
      setSprintLeaderboard(newScores);
      localStorage.setItem('tetris_sprint_scores', JSON.stringify(newScores));
    }
  }, [sprint.state.lines]);

  // Load high scores
  useEffect(() => {
    const saved = localStorage.getItem('tetris_high_scores');
    if (saved) setHighScores(JSON.parse(saved));
    else setHighScores([5000, 4000, 3000, 2000, 1000]);

    const savedSprint = localStorage.getItem('tetris_sprint_scores');
    if (savedSprint) setSprintLeaderboard(JSON.parse(savedSprint));
    else setSprintLeaderboard([]);
  }, []);

  // Update high scores on solo game over
  useEffect(() => {
    if (solo.state.isGameOver) {
      const newScores = [...highScores, solo.state.score].sort((a, b) => b - a).slice(0, 5);
      setHighScores(newScores);
      localStorage.setItem('tetris_high_scores', JSON.stringify(newScores));
    }
  }, [solo.state.isGameOver]);

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const msec = Math.floor((ms % 1000) / 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(2, '0')}`;
  };

  // Ghost positions
  const getGhost = (s: any) => {
    if (!s.activePiece || s.isPaused) return null;
    let y = s.activePiece.pos.y;
    while (true) {
      const nextY = y + 1;
      const collided = s.activePiece.points.some((p: any) => {
        const px = p.x + s.activePiece!.pos.x;
        const py = p.y + nextY;
        return px < 0 || px >= BOARD_WIDTH || py >= BOARD_HEIGHT || (py >= 0 && s.board[py][px] !== null);
      });
      if (collided) break;
      y = nextY;
    }
    return { x: s.activePiece.pos.x, y };
  };

  const soloGhost = useMemo(() => getGhost(solo.state), [solo.state]);
  const p1Ghost = useMemo(() => getGhost(p1.state), [p1.state]);
  const p2Ghost = useMemo(() => getGhost(p2.state), [p2.state]);
  const sprintGhost = useMemo(() => getGhost(sprint.state), [sprint.state]);

  const renderMenu = () => (
    <div className="bg-[#222] border-[12px] border-[#CCC] rounded-[50px] shadow-2xl p-8 relative flex flex-col items-center w-[400px]">
      <div className="py-8 flex flex-col items-center">
        <div className="text-6xl font-black italic tracking-tighter flex mb-12">
          <span className="text-[#f00]">T</span>
          <span className="text-[#f0a000]">E</span>
          <span className="text-[#f0f000]">T</span>
          <span className="text-[#00f000]">R</span>
          <span className="text-[#0000f0]">I</span>
          <span className="text-[#a000f0]">S</span>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => { setMode('SOLO'); solo.reset(); }}
            className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_#1e40af] transition-all uppercase italic"
          >
            SOLO MARATHON
          </button>
          <button 
            onClick={() => { setMode('BATTLE'); p1.reset(); p2.reset(); }}
            className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_#991b1b] transition-all uppercase italic"
          >
            LOCAL BATTLE
          </button>
          <button 
            onClick={() => { setMode('SPRINT'); sprint.reset(); setSprintTime(0); }}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_#a16207] transition-all uppercase italic"
          >
            40-LINE SPRINT
          </button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 w-full">
          <div className="bg-[#111] p-4 rounded-3xl border border-white/5">
            <div className="text-white text-[10px] text-center font-bold uppercase tracking-widest mb-3 opacity-50">Solo Top 5</div>
            <div className="space-y-1">
              {highScores.map((s, i) => (
                <div key={i} className="flex justify-between font-mono text-[14px]">
                  <span className="text-gray-600">{i+1}</span>
                  <span className="text-[#00ff41]">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#111] p-4 rounded-3xl border border-white/5">
            <div className="text-white text-[10px] text-center font-bold uppercase tracking-widest mb-3 opacity-50">Sprint Top 5</div>
            <div className="space-y-1">
              {sprintLeaderboard.map((s, i) => (
                <div key={i} className="flex justify-between font-mono text-[14px]">
                  <span className="text-gray-600">{i+1}</span>
                  <span className="text-yellow-500">{formatTime(s)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#dce1e5] flex items-center justify-center p-4 font-sans overflow-hidden transition-all duration-300 ${isShaking ? 'translate-y-2 scale-[1.01]' : ''}`}>
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-2xl opacity-10 shadow-2xl ${['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'][i % 4]}`}
            animate={{
              rotate: [0, 360],
              y: [Math.random() * 1000, Math.random() * -1000],
              x: [Math.random() * 1000, Math.random() * -1000],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 20 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: 100 + i * 20, height: 100 + i * 20 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'MENU' && (
          <motion.div key="menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            {renderMenu()}
          </motion.div>
        )}

        {mode === 'SOLO' && (
          <motion.div key="solo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center items-center gap-12">
             <div className="hidden lg:flex flex-col gap-8 w-60">
                <GlossyPanel title="Hold"><PiecePreview type={solo.state.holdPiece} /></GlossyPanel>
                <GlossyPanel className="p-6">
                  <LCDDisplay label="Score" value={solo.state.score} />
                  <LCDDisplay label="Level" value={solo.state.level} />
                  <LCDDisplay label="Lines" value={solo.state.lines} />
                </GlossyPanel>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-[#222] border-[12px] border-[#CCC] rounded-[50px] shadow-2xl p-1 pb-4 relative flex flex-col items-center w-[400px]">
                  <div className="py-8"><div className="text-5xl font-black italic tracking-tighter flex drop-shadow-[0_4px_0_black]">
                    <span className="text-[#f00]">T</span><span className="text-[#f0a000]">E</span><span className="text-[#f0f000]">T</span><span className="text-[#00f000]">R</span><span className="text-[#0000f0]">I</span><span className="text-[#a000f0]">S</span>
                  </div></div>
                  
                  <Board state={solo.state} ghostPos={soloGhost} className="w-[340px] mb-6" />

                  <AnimatePresence>
                    {(solo.state.isPaused || solo.state.isGameOver) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-[12px] z-20 bg-black/80 backdrop-blur-md rounded-[38px] flex flex-col items-center justify-center p-8"
                      >
                        {solo.state.isGameOver && (
                          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-6">
                            <h2 className="text-5xl font-black text-red-500 italic uppercase drop-shadow-[0_8px_20px_black] tracking-tighter">GAME OVER</h2>
                            <div className="text-4xl text-white font-mono font-bold">{solo.state.score.toLocaleString()}</div>
                            <button 
                              onClick={solo.reset}
                              className="px-12 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 shadow-xl transition-all uppercase italic text-xl"
                            >
                              RETRY
                            </button>
                          </motion.div>
                        )}

                        {solo.state.isPaused && !solo.state.isGameOver && (
                          <div className="text-center space-y-8">
                             <h2 className="text-5xl font-black text-blue-400 italic tracking-[0.2em] drop-shadow-[0_4px_10px_black]">PAUSED</h2>
                             <button 
                              onClick={solo.pause}
                              className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform m-auto"
                            >
                              <Play fill="black" size={48} className="ml-2" />
                             </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => setMode('MENU')} 
                    className="px-8 h-12 bg-gray-600 rounded-2xl flex items-center justify-center text-white font-black border-b-4 border-gray-800 active:translate-y-1 active:border-b-0 transition-all uppercase text-sm italic tracking-widest shadow-xl"
                  >
                    QUIT GAME
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex flex-col gap-8 w-60">
                <GlossyPanel title="Next">
                  <div className="flex flex-col items-center">
                    {solo.nextPieces.map((p, i) => <PiecePreview key={i} type={p} />)}
                  </div>
                </GlossyPanel>
              </div>
          </motion.div>
        )}

        {mode === 'BATTLE' && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col md:flex-row gap-8 items-stretch pt-20">
             <div className="absolute top-8 inset-x-0 text-center"><div className="text-4xl font-black italic text-red-600 animate-pulse drop-shadow-xl tracking-tighter uppercase">ULTIMATE VERSUS BATTLE</div></div>
             
             {/* Player 1 */}
             <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                   <GlossyPanel className="w-24 h-24 p-0"><div className="scale-75"><PiecePreview type={p1.state.holdPiece} /></div></GlossyPanel>
                   <LCDDisplay value={p1.state.lines} label="Lines Cleared" />
                </div>
                <Board state={p1.state} ghostPos={p1Ghost} className="w-[300px]" isPlayer2={false} />
             </div>

             {/* Center Stats */}
             <div className="flex flex-col justify-center gap-4 w-32 items-center">
                <div className="text-3xl font-black text-white bg-black p-4 rounded-full shadow-2xl border-4 border-red-500">VS</div>
                <button onClick={() => setMode('MENU')} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white text-[10px] uppercase font-bold transition-colors">QUIT</button>
             </div>

             {/* Player 2 */}
             <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                   <LCDDisplay value={p2.state.lines} label="Lines Cleared" />
                   <GlossyPanel className="w-24 h-24 p-0"><div className="scale-75"><PiecePreview type={p2.state.holdPiece} /></div></GlossyPanel>
                </div>
                <Board state={p2.state} ghostPos={p2Ghost} className="w-[300px]" isPlayer2={true} />
             </div>

             {(p1.state.isGameOver || p2.state.isGameOver) && (
               <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
                  <h2 className="text-8xl font-black italic text-white drop-shadow-2xl mb-8">P{p1.state.isGameOver ? '2' : '1'} WINS!</h2>
                  <button onClick={() => { p1.reset(); p2.reset(); }} className="px-12 py-6 bg-white text-black text-4xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-transform uppercase italic">REMATCH</button>
               </div>
             )}
          </motion.div>
        )}

        {mode === 'SPRINT' && (
          <motion.div key="sprint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center items-center gap-12">
             <div className="hidden lg:flex flex-col gap-8 w-60">
                <GlossyPanel title="Hold"><PiecePreview type={sprint.state.holdPiece} /></GlossyPanel>
                <GlossyPanel className="p-6">
                  <LCDDisplay label="Time" value={formatTime(sprintTime)} />
                  <LCDDisplay label="Lines" value={`${sprint.state.lines} / 40`} />
                </GlossyPanel>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-[#222] border-[12px] border-[#CCC] rounded-[50px] shadow-2xl p-1 pb-4 relative flex flex-col items-center w-[400px]">
                  <div className="py-8"><div className="text-5xl font-bold text-yellow-500 italic uppercase">SPRINT</div></div>
                  
                  <Board state={sprint.state} ghostPos={sprintGhost} className="w-[340px] mb-6" />

                  <AnimatePresence>
                    {(sprint.state.isPaused || sprint.state.isGameOver || sprint.state.lines >= 40) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-[12px] z-20 bg-black/80 backdrop-blur-md rounded-[38px] flex flex-col items-center justify-center p-8 text-center"
                      >
                        {sprint.state.lines >= 40 ? (
                           <div className="space-y-6">
                             <h2 className="text-5xl font-black text-green-400 italic uppercase">FINISHED!</h2>
                             <div className="text-6xl text-white font-mono font-black">{formatTime(sprintTime)}</div>
                             <button onClick={() => { sprint.reset(); setSprintTime(0); }} className="px-12 py-4 bg-white text-black font-black rounded-2xl uppercase italic">RETRY</button>
                           </div>
                        ) : sprint.state.isGameOver ? (
                          <div className="space-y-6">
                            <h2 className="text-5xl font-black text-red-500 italic uppercase">FAILED</h2>
                            <button onClick={() => { sprint.reset(); setSprintTime(0); }} className="px-12 py-4 bg-white text-black font-black rounded-2xl uppercase italic">RETRY</button>
                          </div>
                        ) : (
                          <div className="space-y-8">
                             <h2 className="text-5xl font-black text-blue-400 italic uppercase">PAUSED</h2>
                             <button onClick={sprint.pause} className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black shadow-xl m-auto">
                              <Play fill="black" size={48} className="ml-2" />
                             </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => setMode('MENU')} 
                    className="px-8 h-12 bg-gray-600 rounded-2xl flex items-center justify-center text-white font-black border-b-4 border-gray-800 uppercase italic tracking-widest shadow-xl"
                  >
                    QUIT
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex flex-col gap-8 w-60">
                <GlossyPanel title="Next">
                  <div className="flex flex-col items-center">
                    {sprint.nextPieces.map((p, i) => <PiecePreview key={i} type={p} />)}
                  </div>
                </GlossyPanel>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none opacity-5 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
}
