import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGameState } from '../hooks/useGameState';

interface GameOverlayProps {
  score: number;
  lives: number;
  gameOver: boolean;
  ammo: number;
  round: number;
  onStart: () => void;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  score,
  lives,
  gameOver,
  ammo,
  round,
  onStart,
  onRestart
}) => {
  const [startDialogOpen, setStartDialogOpen] = useState(true);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showRoundAnnouncement, setShowRoundAnnouncement] = useState(false);
  
  const { 
    leaderboard, 
    newRoundStarted, 
    acknowledgeNewRound, 
    addToLeaderboard,
    totalEnemiesForRound 
  } = useGameState();
  
  const roundAnnouncementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (score > 0 || lives < 3) {
      setStartDialogOpen(false);
    }
  }, [score, lives]);
  
  useEffect(() => {
    if (gameOver) {
      setGameOverDialogOpen(true);
    } else {
      setGameOverDialogOpen(false);
    }
  }, [gameOver]);
  
  useEffect(() => {
    if (newRoundStarted) {
      setShowRoundAnnouncement(true);
      
      if (roundAnnouncementRef.current) {
        roundAnnouncementRef.current.classList.add('animate-pulse');
      }
      
      const timer = setTimeout(() => {
        setShowRoundAnnouncement(false);
        acknowledgeNewRound();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [newRoundStarted, acknowledgeNewRound]);
  
  const handleStartGame = () => {
    setStartDialogOpen(false);
    onStart();
  };
  
  const handleRestartGame = () => {
    setGameOverDialogOpen(false);
    onRestart();
  };
  
  const handleSubmitScore = () => {
    if (playerName.trim()) {
      addToLeaderboard(playerName);
    } else {
      addToLeaderboard('Anonymous');
    }
    handleRestartGame();
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-white bg-black/30 p-2 rounded">
        <div className="text-xl">Round: {round}</div>
        <div className="text-xl">Enemies: {totalEnemiesForRound}</div>
        <div className="text-xl">Score: {score}</div>
        <div className="text-xl">Lives: {Array(lives).fill('❤️').join(' ')}</div>
        <div className="text-xl">Ammo: {ammo} {ammo <= 3 ? '⚠️' : ''}</div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-white bg-black/30 p-2 rounded text-right">
        <div>WASD or Arrows: Move</div>
        <div>Space: Shoot</div>
        <div>Find <span className="text-yellow-400">⬛</span> to get ammo!</div>
      </div>
      
      {showRoundAnnouncement && (
        <div 
          ref={roundAnnouncementRef}
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-8 py-4 rounded-lg text-center"
        >
          <h2 className="text-4xl font-bold mb-2">Round {round}</h2>
          <p className="text-xl">Get ready! {totalEnemiesForRound} zombies are coming!</p>
          {round > 1 && <p className="text-lg mt-2 text-yellow-400">+{Math.min(5 + round, 20)} ammo bonus!</p>}
        </div>
      )}
      
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="sm:max-w-md pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold mb-4 text-game-player">Forest Zombie Survival</DialogTitle>
            <DialogDescription>
              Survive the zombie apocalypse in the forest!
            </DialogDescription>
          </DialogHeader>
          <div className="mb-6 text-lg">
            Move with WASD or arrow keys, and shoot with spacebar.
            Watch your ammo and collect refills from yellow boxes. Each round will get harder with more zombies!
          </div>
          <Button 
            onClick={handleStartGame}
            className="w-full pointer-events-auto bg-game-player hover:bg-game-player/80 text-xl py-6"
          >
            Start Game
          </Button>
        </DialogContent>
      </Dialog>
      
      <Dialog open={gameOverDialogOpen} onOpenChange={setGameOverDialogOpen}>
        <DialogContent className="sm:max-w-md pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-red-500 mb-2">Game Over!</DialogTitle>
            <DialogDescription>
              Better luck next time!
            </DialogDescription>
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
          
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
            <div className="bg-slate-800 p-3 rounded max-h-60 overflow-y-auto">
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
    </div>
  );
};
