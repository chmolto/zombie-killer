
import React, { useRef, useEffect } from 'react';

interface MinimapProps {
  playerPosition: [number, number, number];
  enemies: { id: number; position: [number, number, number] }[];
  ammoBoxes: { id: number; position: [number, number, number] }[];
}

export const Minimap: React.FC<MinimapProps> = ({ playerPosition, enemies, ammoBoxes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapSize = 150; // Pixel size of the minimap
  const gameAreaSize = 15; // Match the game area size
  
  useEffect(() => {
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
      
      // Draw direction indicator
      // Assuming player is looking in the direction they're moving
      if (playerPosition[0] !== 0 || playerPosition[2] !== 0) {
        const dirLength = 8;
        ctx.beginPath();
        ctx.moveTo(playerX, playerZ);
        ctx.lineTo(
          playerX, 
          playerZ - dirLength // Simplified, just point up
        );
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw enemies
      enemies.forEach(enemy => {
        const [enemyX, enemyZ] = toMapCoords(enemy.position[0], enemy.position[2]);
        ctx.beginPath();
        ctx.arc(enemyX, enemyZ, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#97F58B';
        ctx.fill();
      });
      
      // Draw ammo boxes
      ammoBoxes.forEach(box => {
        const [boxX, boxZ] = toMapCoords(box.position[0], box.position[2]);
        ctx.beginPath();
        ctx.rect(boxX - 3, boxZ - 3, 6, 6);
        ctx.fillStyle = '#D3AB1C';
        ctx.fill();
      });
    };
    
    // Update on frame
    const intervalId = setInterval(updateMinimap, 1000 / 30); // 30 fps
    return () => clearInterval(intervalId);
  }, [playerPosition, enemies, ammoBoxes]);
  
  return (
    <div className="absolute top-4 right-4 pointer-events-none z-10">
      <canvas
        ref={canvasRef}
        width={mapSize}
        height={mapSize}
        className="rounded-full"
      />
    </div>
  );
};
