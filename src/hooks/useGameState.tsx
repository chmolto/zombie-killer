
import { create } from 'zustand';

interface GameState {
  score: number;
  lives: number;
  gameOver: boolean;
  gameStarted: boolean;
  increaseScore: () => void;
  decreaseLives: () => void;
  startGame: () => void;
  resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
  score: 0,
  lives: 3,
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
  
  startGame: () => set({
    gameStarted: true,
    gameOver: false,
    score: 0,
    lives: 3,
  }),
  
  resetGame: () => set({
    gameStarted: true,
    gameOver: false,
    score: 0,
    lives: 3,
  }),
}));
