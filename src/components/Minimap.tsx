import React, { useRef, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';

interface MinimapProps {
  playerPosition: [number, number, number];
  enemies: { id: number; position: [number, number, number]; isDying?: boolean }[];
  ammoBoxes: { id: number; position: [number, number, number] }[];
}

export const Minimap: React.FC<MinimapProps> = ({ playerPosition, enemies, ammoBoxes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapSize = 150; // Pixel size of the minimap
  const gameAreaSize = 30; // Updated to match our expanded game area
  
  // Get current round information from game state
  const { round } = useGameState();
  
  // Calculate total enemies for current round and remaining count
  const totalEnemiesForRound = 5 + (round * 3);
  const aliveEnemiesCount = enemies.filter(e => !e.isDying).length;
  const remainingEnemies = aliveEnemiesCount;
  
  useEffect(() => {
    let animationFrameId: number;
    
    const updateMinimap = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, mapSize, mapSize);
      
      // Draw circular border and background
      ctx.beginPath();
      ctx.arc(mapSize / 2, mapSize / 2, mapSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#9b87f5';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Scale factor for game coordinates to canvas
      const scale = mapSize / (gameAreaSize * 2);
      
      // Function to convert game coords to minimap coords
      const toMapCoords = (x: number, z: number): [number, number] => {
        return [
          mapSize / 2 + x * scale,
          mapSize / 2 + z * scale
        ];
      };
      
      // Draw player (center dot)
      const [playerX, playerZ] = toMapCoords(playerPosition[0], playerPosition[2]);
      ctx.beginPath();
      ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#9b87f5';
      ctx.fill();
      
      // Draw direction indicator (player arrow)
      const dirLength = 8;
      ctx.beginPath();
      ctx.moveTo(playerX, playerZ);
      ctx.lineTo(
        playerX, 
        playerZ - dirLength // Point up (north)
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw enemies - differentiate regular from dying enemies
      enemies.forEach(enemy => {
        if (enemy.isDying) return; // Don't show dying enemies on minimap
        
        const [enemyX, enemyZ] = toMapCoords(enemy.position[0], enemy.position[2]);
        ctx.beginPath();
        ctx.arc(enemyX, enemyZ, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444'; // Red for enemies
        ctx.fill();
      });
      
      // Draw ammo boxes
      ammoBoxes.forEach(box => {
        const [boxX, boxZ] = toMapCoords(box.position[0], box.position[2]);
        ctx.beginPath();
        ctx.rect(boxX - 3, boxZ - 3, 6, 6);
        ctx.fillStyle = '#ffff44'; // Bright yellow for ammo
        ctx.fill();
      });
      
      // Draw forest boundary indicator (subtle circle at the edge of playable area)
      ctx.beginPath();
      ctx.arc(mapSize / 2, mapSize / 2, mapSize * 0.85 / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 160, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Request next frame
      animationFrameId = requestAnimationFrame(updateMinimap);
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateMinimap);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [playerPosition, enemies, ammoBoxes, gameAreaSize]);
  
  return (
    <div className="absolute top-4 right-4 pointer-events-none z-10 flex flex-col items-end gap-1">
      {/* Minimap canvas */}
      <canvas
        ref={canvasRef}
        width={mapSize}
        height={mapSize}
        className="rounded-full border-2 border-[#9b87f5]"
      />
      
      {/* Remaining enemies counter - moved below the minimap */}
      <div className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm mt-2 border border-[#9b87f5]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Zombies: {remainingEnemies}</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">Round {round}</div>
      </div>
    </div>
  );
};
