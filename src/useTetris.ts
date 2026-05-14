import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BOARD_WIDTH, 
  BOARD_HEIGHT, 
  SHAPES, 
  TetrominoType, 
  Point, 
  WALL_KICK_DATA, 
  WALL_KICK_DATA_I 
} from '../constants';
import { sound } from '../lib/sound';

type Cell = string | null;

export interface GameState {
  board: Cell[][];
  activePiece: {
    type: TetrominoType;
    pos: Point;
    rotation: number;
    points: Point[];
    lastMoveWasRotate: boolean; // For T-Spin detection
  } | null;
  nextPiece: TetrominoType;
  holdPiece: TetrominoType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
  backToBack: boolean;
  lastAction: string | null; // For technical feedback popups
  garbageToReceive: number; // For battle mode
}

const createEmptyBoard = () => 
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const getRandomPiece = (exclude?: TetrominoType[]) => {
  const types = Object.values(TetrominoType);
  const available = exclude ? types.filter(t => !exclude.includes(t)) : types;
  return available[Math.floor(Math.random() * available.length)];
};

class RandomBag {
  private bag: TetrominoType[] = [];

  constructor() {
    this.refill();
  }

  private refill() {
    this.bag = [...Object.values(TetrominoType).sort(() => Math.random() - 0.5), ...this.bag];
  }

  getNext() {
    if (this.bag.length < 10) {
      this.refill();
    }
    return this.bag.pop()!;
  }

  peekNext(n: number) {
    if (this.bag.length < n) {
      this.refill();
    }
    return this.bag.slice(-n).reverse();
  }
}

export const useTetris = (onLinesCleared?: (count: number) => void, onAction?: (action: string) => void) => {
  const bagRef = useRef(new RandomBag());

  const [state, setState] = useState<GameState>({
    board: createEmptyBoard(),
    activePiece: null,
    nextPiece: bagRef.current.getNext(),
    holdPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    isGameOver: false,
    isPaused: true,
    backToBack: false,
    lastAction: null,
    garbageToReceive: 0,
  });

  const [nextPieces, setNextPieces] = useState<TetrominoType[]>([]);

  useEffect(() => {
    setNextPieces(bagRef.current.peekNext(3));
  }, []);

  const spawnPiece = useCallback((type?: TetrominoType) => {
    const pieceType = type || state.nextPiece;
    const nextType = bagRef.current.getNext();
    setNextPieces(bagRef.current.peekNext(3));
    const shapes = SHAPES[pieceType].shapes[0];
    
    const startPos = { 
      x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(shapes.reduce((max, p) => Math.max(max, p.x), 0) / 2), 
      y: 0 
    };

    // Check collision on spawn
    const overlaps = shapes.some(p => {
      const x = p.x + startPos.x;
      const y = p.y + startPos.y;
      return state.board[y]?.[x] !== null;
    });

    if (overlaps) {
      setState(s => ({ ...s, isGameOver: true }));
      return;
    }

    setState(s => {
      // Process garbage before spawning if any
      let newBoard = s.board;
      if (s.garbageToReceive > 0) {
        newBoard = s.board.slice(s.garbageToReceive);
        const holeX = Math.floor(Math.random() * BOARD_WIDTH);
        for (let i = 0; i < s.garbageToReceive; i++) {
          const row = Array(BOARD_WIDTH).fill('#666');
          row[holeX] = null;
          newBoard.push(row);
        }
      }

      return {
        ...s,
        board: newBoard,
        garbageToReceive: 0,
        activePiece: {
          type: pieceType,
          pos: startPos,
          rotation: 0,
          points: shapes,
          lastMoveWasRotate: false,
        },
        nextPiece: nextType,
        canHold: true,
      };
    });
  }, [state.nextPiece, state.board]);

  const checkCollision = useCallback((pos: Point, points: Point[], board: Cell[][]) => {
    return points.some(p => {
      const x = p.x + pos.x;
      const y = p.y + pos.y;
      return (
        x < 0 || 
        x >= BOARD_WIDTH || 
        y >= BOARD_HEIGHT || 
        (y >= 0 && board[y][x] !== null)
      );
    });
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    setState(s => {
      if (!s.activePiece || s.isGameOver || s.isPaused) return s;

      const newPos = { 
        x: s.activePiece.pos.x + dx, 
        y: s.activePiece.pos.y + dy 
      };

      if (!checkCollision(newPos, s.activePiece.points, s.board)) {
        return {
          ...s,
          activePiece: { ...s.activePiece, pos: newPos, lastMoveWasRotate: false }
        };
      }

      if (dy > 0) return lockPiece(s);
      return s;
    });
  }, [checkCollision]);

  const rotate = useCallback((dir: number) => {
    setState(s => {
      if (!s.activePiece || s.isGameOver || s.isPaused) return s;

      const { type, pos, rotation } = s.activePiece;
      const nextRotation = (rotation + dir + 4) % 4;
      const nextPoints = SHAPES[type].shapes[nextRotation];
      
      const kickKey = `${rotation}-${nextRotation}` as keyof typeof WALL_KICK_DATA;
      const kicks = type === TetrominoType.I ? WALL_KICK_DATA_I[kickKey] : WALL_KICK_DATA[kickKey];

      for (const kick of kicks) {
        const testPos = { x: pos.x + kick.x, y: pos.y - kick.y };
        if (!checkCollision(testPos, nextPoints, s.board)) {
          return {
            ...s,
            activePiece: {
              ...s.activePiece,
              pos: testPos,
              rotation: nextRotation,
              points: nextPoints,
              lastMoveWasRotate: true,
            }
          };
        }
      }
      return s;
    });
  }, [checkCollision]);

  const detectTSpin = (s: GameState): { type: 'T-SPIN' | 'MINI' | null; corners: number } => {
    if (!s.activePiece || s.activePiece.type !== TetrominoType.T || !s.activePiece.lastMoveWasRotate) {
      return { type: null, corners: 0 };
    }

    const { pos } = s.activePiece;
    const corners = [
      { x: pos.x + 0, y: pos.y + 0 },
      { x: pos.x + 2, y: pos.y + 0 },
      { x: pos.x + 0, y: pos.y + 2 },
      { x: pos.x + 2, y: pos.y + 2 },
    ];

    let occupied = 0;
    corners.forEach(p => {
      if (p.x < 0 || p.x >= BOARD_WIDTH || p.y >= BOARD_HEIGHT || (p.y >= 0 && s.board[p.y][p.x] !== null)) {
        occupied++;
      }
    });

    if (occupied >= 3) {
      return { type: 'T-SPIN', corners: occupied };
    }
    return { type: null, corners: occupied };
  };

  const lockPiece = (s: GameState): GameState => {
    if (!s.activePiece) return s;
    sound.playLock();

    const newBoard = s.board.map(row => [...row]);
    s.activePiece.points.forEach(p => {
      const x = p.x + s.activePiece!.pos.x;
      const y = p.y + s.activePiece!.pos.y;
      if (y >= 0) newBoard[y][x] = SHAPES[s.activePiece!.type].color;
    });

    const tSpinResult = detectTSpin(s);
    let linesCleared = 0;
    const filteredBoard = newBoard.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (filteredBoard.length < BOARD_HEIGHT) {
      filteredBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    // Scoring logic
    let technicalAction = null;
    let baseScore = 0;
    let garbageToSend = 0;

    if (linesCleared > 0) {
      const isTechnical = linesCleared === 4 || tSpinResult.type !== null;
      const isBackToBack = s.backToBack && isTechnical;
      
      const combo = s.combo + 1;
      let lineBase = 0;
      
      if (tSpinResult.type) {
        technicalAction = `T-SPIN ${['SINGLE', 'DOUBLE', 'TRIPLE'][linesCleared - 1] || 'SPIN'}`;
        lineBase = [400, 800, 1200, 1600][linesCleared] || 400;
        garbageToSend = [2, 4, 6][linesCleared - 1] || 1;
      } else {
        lineBase = [0, 100, 300, 500, 800][linesCleared];
        garbageToSend = [0, 0, 1, 2, 4][linesCleared];
        if (linesCleared === 4) technicalAction = "TETRIS!";
      }

      const multiplier = isBackToBack ? 1.5 : 1;
      baseScore = (lineBase * multiplier) + (combo * 50 * s.level);
      
      onAction?.(technicalAction || `${linesCleared} LINES`);
      if (garbageToSend > 0) onLinesCleared?.(garbageToSend);
      sound.playClear();
      
      return {
        ...s,
        board: filteredBoard,
        activePiece: null,
        score: s.score + Math.floor(baseScore),
        lines: s.lines + linesCleared,
        level: Math.floor((s.lines + linesCleared) / 10) + 1,
        combo,
        backToBack: isTechnical,
        lastAction: technicalAction,
      };
    }

    return {
      ...s,
      board: filteredBoard,
      activePiece: null,
      combo: -1,
      lastAction: null,
    };
  };

  const hardDrop = useCallback(() => {
    setState(s => {
      if (!s.activePiece || s.isGameOver || s.isPaused) return s;

      let finalPos = { ...s.activePiece.pos };
      while (!checkCollision({ ...finalPos, y: finalPos.y + 1 }, s.activePiece.points, s.board)) {
        finalPos.y += 1;
      }

      return lockPiece({
        ...s,
        activePiece: { ...s.activePiece, pos: finalPos }
      });
    });
  }, [checkCollision]);

  const hold = useCallback(() => {
    setState(s => {
      if (!s.activePiece || s.isGameOver || s.isPaused || !s.canHold) return s;

      const typeToHold = s.activePiece.type;
      const nextType = s.holdPiece || s.nextPiece;
      
      const newState = {
        ...s,
        holdPiece: typeToHold,
        canHold: false,
        activePiece: null,
      };

      if (!s.holdPiece) {
        // First hold, need to pick next piece
        const nextNextType = bagRef.current.getNext();
        newState.nextPiece = nextNextType;
      }

      return newState;
    });
  }, []);

  const pause = useCallback(() => {
    setState(s => ({ ...s, isPaused: !s.isPaused }));
  }, []);

  const reset = useCallback(() => {
    bagRef.current = new RandomBag();
    setState({
      board: createEmptyBoard(),
      activePiece: null,
      nextPiece: bagRef.current.getNext(),
      holdPiece: null,
      canHold: true,
      score: 0,
      level: 1,
      lines: 0,
      combo: -1,
      isGameOver: false,
      isPaused: false,
      backToBack: false,
      lastAction: null,
      garbageToReceive: 0,
    });
  }, []);

  const addGarbage = useCallback((amount: number) => {
    setState(s => ({ ...s, garbageToReceive: Math.min(BOARD_HEIGHT - 2, s.garbageToReceive + amount) }));
  }, []);

  // Game Loop
  useEffect(() => {
    if (state.isGameOver || state.isPaused) return;

    if (!state.activePiece) {
      spawnPiece();
      return;
    }

    const dropTime = Math.max(100, 1000 - (state.level - 1) * 100);
    const interval = setInterval(() => {
      move(0, 1);
    }, dropTime);

    return () => clearInterval(interval);
  }, [state.activePiece, state.isGameOver, state.isPaused, state.level, move, spawnPiece]);

  return {
    state,
    nextPieces,
    move,
    rotate,
    hardDrop,
    hold,
    pause,
    reset,
    addGarbage,
  };
};
