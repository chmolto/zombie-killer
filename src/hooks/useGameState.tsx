import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface for leaderboard entry
interface LeaderboardEntry {
  name: string;
  score: number;
  round: number;
  date: string;
}

interface GameState {
  score: number;
  lives: number;
  ammo: number;
  round: number;
  gameOver: boolean;
  gameStarted: boolean;
  newRoundStarted: boolean;
  leaderboard: LeaderboardEntry[];
  increaseScore: () => void;
  decreaseLives: () => void;
  useAmmo: () => boolean;
  addAmmo: (amount: number) => void;
  startGame: () => void;
  resetGame: () => void;
  nextRound: () => void;
  acknowledgeNewRound: () => void;
  addToLeaderboard: (name: string) => void;
}

export const useGameState = create<GameState>()(
  persist(
    (set, get) => ({
      score: 0,
      lives: 3,
      ammo: 10,
      round: 1,
      gameOver: false,
      gameStarted: false,
      newRoundStarted: false,
      leaderboard: [],
      
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
        round: 1,
        newRoundStarted: true,
      }),
      
      resetGame: () => set({
        gameStarted: true,
        gameOver: false,
        score: 0,
        lives: 3,
        ammo: 10,
        round: 1,
        newRoundStarted: true,
      }),
      
      // Advance to the next round
      nextRound: () => set((state) => {
        const newRound = state.round + 1;
        // Add bonus ammo for surviving a round
        const bonusAmmo = Math.min(5 + newRound, 20); 
        
        return {
          round: newRound,
          ammo: state.ammo + bonusAmmo,
          newRoundStarted: true, // Flag to show the round announcement
        };
      }),
      
      // Mark the new round announcement as acknowledged
      acknowledgeNewRound: () => set({
        newRoundStarted: false,
      }),
      
      // Add current score to leaderboard
      addToLeaderboard: (name: string) => set((state) => {
        const newEntry: LeaderboardEntry = {
          name: name.substring(0, 15), // Limit name length
          score: state.score,
          round: state.round,
          date: new Date().toLocaleDateString()
        };
        
        // Sort by score (highest first)
        const updatedLeaderboard = [...state.leaderboard, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep only top 10
        
        return { leaderboard: updatedLeaderboard };
      }),
    }),
    {
      name: 'zombie-game-storage', // Local storage key
      partialize: (state) => ({ leaderboard: state.leaderboard }), // Only persist leaderboard
    }
  )
);
