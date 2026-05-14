import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES } from '../constants';
import { GameState } from '../hooks/useTetris';

interface BoardProps {
  state: GameState;
  ghostPos: { x: number; y: number } | null;
  className?: string;
  isPlayer2?: boolean;
}

export const Board: React.FC<BoardProps> = ({ state, ghostPos, className, isPlayer2 }) => {
  return (
    <div className={`relative bg-[#0a0a0a] border-4 border-[#222] rounded-[24px] overflow-hidden shadow-inner ${className}`} style={{ aspectRatio: '1/2' }}>
      
      {/* Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-20 pointer-events-none opacity-20">
        {Array.from({ length: 200 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-white/5" />
        ))}
      </div>

      {/* Render Blocks */}
      {state.board.map((row, y) => 
        row.map((cell, x) => cell && (
          <motion.div 
            layout
            key={`${x}-${y}`} 
            className="absolute w-[10%] h-[5%] rounded-sm shadow-[inset_3px_3px_6px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]"
            style={{ 
              backgroundColor: cell,
              left: `${x * 10}%`,
              top: `${y * 5}%`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10" />
          </motion.div>
        ))
      )}

      {/* Active Piece */}
      {state.activePiece && !state.isPaused && (
        <>
          {ghostPos && state.activePiece.points.map((p, i) => (
            <div 
              key={`ghost-${i}`} 
              className="absolute w-[10%] h-[5%] rounded-sm border-[1px] border-white/15 bg-white/5"
              style={{ 
                left: `${(p.x + ghostPos.x) * 10}%`,
                top: `${(p.y + ghostPos.y) * 5}%`
              }}
            />
          ))}
          {state.activePiece.points.map((p, i) => (
            <div 
              key={`active-${i}`} 
              className="absolute w-[10%] h-[5%] rounded-sm shadow-[inset_4px_4px_6px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]"
              style={{ 
                backgroundColor: SHAPES[state.activePiece!.type].color,
                left: `${(p.x + state.activePiece!.pos.x) * 10}%`,
                top: `${(p.y + state.activePiece!.pos.y) * 5}%`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/20" />
            </div>
          ))}
        </>
      )}

      {/* Technical Popups (T-SPIN, etc) */}
      <AnimatePresence>
        {state.lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: -50, scale: 1.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none z-30"
          >
            <div className="bg-yellow-400 text-black font-black italic px-4 py-1 rounded-lg text-2xl shadow-xl border-4 border-black uppercase transform -rotate-12">
              {state.lastAction}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Garbage Meter */}
      {state.garbageToReceive > 0 && (
        <div className="absolute left-0 bottom-0 top-0 w-2 bg-red-900/50 flex flex-col justify-end">
          <div 
            className="bg-red-500 w-full transition-all duration-300" 
            style={{ height: `${(state.garbageToReceive / BOARD_HEIGHT) * 100}%` }}
          />
        </div>
      )}

      {/* Player Label */}
      <div className="absolute top-2 right-4 text-white/20 font-black italic tracking-tighter text-4xl select-none uppercase">
        P{isPlayer2 ? '2' : '1'}
      </div>
    </div>
  );
};
