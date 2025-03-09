import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGameState } from '../hooks/useGameState';

interface GameOverlayProps {
  score: number;
  lives: number;
  gameOver: boolean;
  ammo: number;
  onStart: () => void;
  onRestart: () => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  score,
  lives,
  gameOver,
  ammo,
  onStart,
  onRestart,
  isPaused,
  setIsPaused
}) => {
  const [startDialogOpen, setStartDialogOpen] = useState(true);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showRoundAnnouncement, setShowRoundAnnouncement] = useState(false);
  
  // Get game state from global store
  const { 
    round, 
    leaderboard, 
    newRoundStarted, 
    acknowledgeNewRound, 
    addToLeaderboard 
  } = useGameState();
  
  // Refs for animations
  const roundAnnouncementRef = useRef<HTMLDivElement>(null);
  
  // Close start dialog when game starts
  useEffect(() => {
    if (score > 0 || lives < 3) {
      setStartDialogOpen(false);
    }
  }, [score, lives]);
  
  // Show game over dialog when game is over
  useEffect(() => {
    if (gameOver) {
      setGameOverDialogOpen(true);
    } else {
      setGameOverDialogOpen(false);
    }
  }, [gameOver]);
  
  // Handle round announcements
  useEffect(() => {
    if (newRoundStarted) {
      setShowRoundAnnouncement(true);
      
      // Animation for round announcement
      if (roundAnnouncementRef.current) {
        roundAnnouncementRef.current.classList.add('animate-pulse');
      }
      
      // Automatically hide the announcement after a delay
      const timer = setTimeout(() => {
        setShowRoundAnnouncement(false);
        acknowledgeNewRound();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [newRoundStarted, acknowledgeNewRound]);
  
  // Handle ESC key for pausing the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !startDialogOpen && !gameOverDialogOpen) {
        setIsPaused(!isPaused);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startDialogOpen, gameOverDialogOpen, isPaused, setIsPaused]);
  
  const handleStartGame = () => {
    if (!playerName.trim()) return;
    setStartDialogOpen(false);
    onStart();
  };
  
  const handleRestartGame = () => {
    setGameOverDialogOpen(false);
    onRestart();
  };
  
  const handleSubmitScore = () => {
    // We already have the player name from the start screen
    if (playerName.trim()) {
      addToLeaderboard(playerName);
    } else {
      addToLeaderboard('Anonymous');
    }
    handleRestartGame();
  };
  
  const handleResume = () => {
    setIsPaused(false);
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-white bg-black/30 p-2 rounded">
        <div className="text-xl">Round: {round}</div>
        <div className="text-xl">Score: {score}</div>
        <div className="text-xl">Lives: {Array(lives).fill('❤️').join(' ')}</div>
        <div className="text-xl">Ammo: {ammo} {ammo <= 3 ? '⚠️' : ''}</div>
      </div>
      
      {/* Controls info */}
      <div className="absolute bottom-4 right-4 text-white bg-black/30 p-2 rounded text-right">
        <div>WASD or Arrows: Move</div>
        <div>Space: Shoot</div>
        <div>Find <span className="text-yellow-400">⬛</span> to get ammo!</div>
      </div>
      
      {/* Round Announcement */}
      {showRoundAnnouncement && (
        <div 
          ref={roundAnnouncementRef}
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-8 py-4 rounded-lg text-center"
        >
          <h2 className="text-4xl font-bold mb-2">Round {round}</h2>
          <p className="text-xl">Get ready! More zombies are coming!</p>
          {round > 1 && <p className="text-lg mt-2 text-yellow-400">+{Math.min(5 + round, 20)} ammo bonus!</p>}
        </div>
      )}
      
      {/* Start Dialog */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="sm:max-w-md pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold mb-4 text-game-player">Forest Zombie Survival</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-lg">
            Survive the zombie apocalypse in the forest! Move with WASD or arrow keys, and shoot with spacebar.
            Watch your ammo and collect refills from yellow boxes. Each round will get harder with more zombies!
          </div>
          
          <div className="mb-6">
            <Label htmlFor="start-player-name" className="mb-2 block text-lg">Enter your name:</Label>
            <Input 
              id="start-player-name" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="pointer-events-auto"
              maxLength={15}
            />
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full pointer-events-auto bg-game-player hover:bg-game-player/80 text-xl py-6"
            disabled={!playerName.trim()}
          >
            Start Game
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Game Over Dialog with Leaderboard */}
      <Dialog open={gameOverDialogOpen} onOpenChange={setGameOverDialogOpen}>
        <DialogContent className="sm:max-w-md pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-red-500 mb-2">Game Over!</DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <p className="text-xl">You scored {score} points and reached round {round}!</p>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="player-name" className="mb-2 block text-lg">Enter your name for the leaderboard:</Label>
            <Input 
              id="player-name" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="pointer-events-auto"
              maxLength={15}
            />
          </div>
          
          {/* Leaderboard */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
            <div className="p-3 rounded max-h-60 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="py-2">Rank</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Round</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className="py-1">{index + 1}</td>
                        <td className="py-1">{entry.name}</td>
                        <td className="py-1">{entry.score}</td>
                        <td className="py-1">{entry.round}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-2 text-center">No scores yet!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleSubmitScore}
              className="w-full pointer-events-auto bg-game-player hover:bg-game-player/80 text-lg py-4"
            >
              Submit & Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pause Dialog */}
      {isPaused && (
        <Dialog open={isPaused} onOpenChange={setIsPaused}>
          <DialogContent className="sm:max-w-md pointer-events-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold mb-2">Game Paused</DialogTitle>
            </DialogHeader>
            
            <div className="mb-4 text-lg">
              <p>Game paused. Press ESC to resume or use the button below.</p>
              <div className="mt-4 p-3 rounded">
                <p className="text-sm mb-2">Current Stats:</p>
                <p>Round: {round}</p>
                <p>Score: {score}</p>
                <p>Lives: {Array(lives).fill('❤️').join(' ')}</p>
                <p>Ammo: {ammo}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleResume}
                className="w-full pointer-events-auto bg-game-player hover:bg-game-player/80 text-lg py-4"
              >
                Resume Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
