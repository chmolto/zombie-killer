
import React from 'react';
import { Button } from '@/components/ui/button';

interface GameOverlayProps {
  score: number;
  lives: number;
  gameOver: boolean;
  onStart: () => void;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  score,
  lives,
  gameOver,
  onStart,
  onRestart
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-white bg-black/30 p-2 rounded">
        <div className="text-xl">Score: {score}</div>
        <div className="text-xl">Lives: {Array(lives).fill('❤️').join(' ')}</div>
      </div>
      
      {/* Controls info */}
      <div className="absolute bottom-4 right-4 text-white bg-black/30 p-2 rounded text-right">
        <div>WASD or Arrows: Move</div>
        <div>Space: Shoot</div>
      </div>
      
      {/* Start screen */}
      {!gameOver && score === 0 && lives === 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-background p-8 rounded-lg max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4 text-game-player">Low Poly Zombie Blast</h1>
            <p className="mb-6 text-lg">
              Survive the zombie apocalypse! Move with WASD or arrow keys, and shoot with spacebar. How long can you last?
            </p>
            <Button 
              onClick={onStart}
              className="pointer-events-auto bg-game-player hover:bg-game-player/80 text-xl py-6 px-8"
            >
              Start Game
            </Button>
          </div>
        </div>
      )}
      
      {/* Game over screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-background p-8 rounded-lg max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4 text-destructive">Game Over</h1>
            <p className="text-2xl mb-4">Your score: {score}</p>
            <Button 
              onClick={onRestart}
              className="pointer-events-auto bg-game-player hover:bg-game-player/80 text-xl py-6 px-8"
            >
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
