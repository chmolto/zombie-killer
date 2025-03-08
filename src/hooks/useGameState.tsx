
import { create } from 'zustand';

interface GameState {
  score: number;
  lives: number;
  ammo: number;
  gameOver: boolean;
  gameStarted: boolean;
  increaseScore: () => void;
  decreaseLives: () => void;
  useAmmo: () => boolean;
  addAmmo: (amount: number) => void;
  startGame: () => void;
  resetGame: () => void;
}

export const useGameState = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  ammo: 10,
  gameOver: false,
  gameStarted: false,
  
  increaseScore: () => set((state) => ({ score: state.score + 10 })),
  
  decreaseLives: () => set((state) => {
    const newLives = state.lives - 1;
    const gameOver = newLives <= 0;
    
    return {
      lives: newLives,
      gameOver,
    };
  }),
  
  useAmmo: () => {
    const { ammo } = get();
    if (ammo <= 0) return false;
    
    set((state) => ({ ammo: state.ammo - 1 }));
    return true;
  },
  
  addAmmo: (amount: number) => set((state) => ({ 
    ammo: state.ammo + amount 
  })),
  
  startGame: () => set({
    gameStarted: true,
    gameOver: false,
    score: 0,
    lives: 3,
    ammo: 10,
  }),
  
  resetGame: () => set({
    gameStarted: true,
    gameOver: false,
    score: 0,
    lives: 3,
    ammo: 10,
  }),
}));
