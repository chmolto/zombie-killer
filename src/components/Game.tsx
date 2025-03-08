
import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Ground } from './Ground';
import { Bullet } from './Bullet';
import { GameOverlay } from './GameOverlay';
import { useGameState } from '../hooks/useGameState';

export const Game = () => {
  const { 
    score, 
    gameOver, 
    lives, 
    startGame, 
    resetGame 
  } = useGameState();

  return (
    <div className="w-full h-screen bg-game-bg relative">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <color attach="background" args={['#1A1F2C']} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 10, 10]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
        </directionalLight>
        <fog attach="fog" args={['#1A1F2C', 0, 40]} />
        
        {!gameOver && (
          <GameScene />
        )}
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          enableRotate={false} 
          makeDefault 
        />
      </Canvas>
      
      <GameOverlay
        score={score}
        lives={lives}
        gameOver={gameOver}
        onStart={startGame}
        onRestart={resetGame}
      />
    </div>
  );
};

const GameScene = () => {
  const [enemies, setEnemies] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [bullets, setBullets] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number] }[]>([]);
  const playerRef = useRef<any>(null);
  const enemyIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const gameAreaSize = 15;
  
  const { increaseScore, decreaseLives } = useGameState();

  // Spawn enemies
  useEffect(() => {
    const spawnEnemy = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = gameAreaSize * 0.8;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      setEnemies(prev => [
        ...prev, 
        { 
          id: enemyIdRef.current++, 
          position: [x, 0, z] 
        }
      ]);
    };

    const interval = setInterval(spawnEnemy, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle shooting
  useEffect(() => {
    const handleShoot = (e: KeyboardEvent) => {
      if (e.key === ' ' && playerRef.current) {
        const playerPos = playerRef.current.getPosition();
        const playerDir = playerRef.current.getDirection();
        
        setBullets(prev => [
          ...prev,
          {
            id: bulletIdRef.current++,
            position: [playerPos[0], 0.5, playerPos[2]],
            direction: [playerDir[0], 0, playerDir[2]]
          }
        ]);
      }
    };

    window.addEventListener('keydown', handleShoot);
    return () => window.removeEventListener('keydown', handleShoot);
  }, []);

  // Game loop
  useFrame(() => {
    if (!playerRef.current) return;
    
    const playerPosition = playerRef.current.getPosition();
    
    // Update bullets
    setBullets(prev => 
      prev
        .map(bullet => {
          const newPosition: [number, number, number] = [
            bullet.position[0] + bullet.direction[0] * 0.5,
            bullet.position[1],
            bullet.position[2] + bullet.direction[2] * 0.5
          ];
          
          return { ...bullet, position: newPosition };
        })
        .filter(bullet => {
          // Remove bullets that go too far
          const distanceFromCenter = Math.sqrt(
            bullet.position[0] * bullet.position[0] + 
            bullet.position[2] * bullet.position[2]
          );
          return distanceFromCenter < gameAreaSize;
        })
    );
    
    // Update enemies and check collisions
    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => {
        // Move towards player
        const dirX = playerPosition[0] - enemy.position[0];
        const dirZ = playerPosition[2] - enemy.position[2];
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        if (length < 0.1) {
          // Collision with player
          decreaseLives();
          return null;
        }
        
        const speed = 0.04;
        const newX = enemy.position[0] + (dirX / length) * speed;
        const newZ = enemy.position[2] + (dirZ / length) * speed;
        
        return { 
          ...enemy, 
          position: [newX, enemy.position[1], newZ] as [number, number, number]
        };
      }).filter(Boolean) as typeof prev;
      
      // Check bullet collisions
      const remainingEnemies = [...updatedEnemies];
      const remainingBullets = [...bullets];
      
      for (let i = remainingEnemies.length - 1; i >= 0; i--) {
        const enemy = remainingEnemies[i];
        
        for (let j = remainingBullets.length - 1; j >= 0; j--) {
          const bullet = remainingBullets[j];
          
          const dx = enemy.position[0] - bullet.position[0];
          const dz = enemy.position[2] - bullet.position[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < 1) {
            // Hit!
            remainingEnemies.splice(i, 1);
            remainingBullets.splice(j, 1);
            increaseScore();
            break;
          }
        }
      }
      
      setBullets(remainingBullets);
      return remainingEnemies;
    });
  });

  return (
    <>
      <Ground size={gameAreaSize} />
      <Player ref={playerRef} />
      
      {enemies.map(enemy => (
        <Enemy key={enemy.id} position={enemy.position} />
      ))}
      
      {bullets.map(bullet => (
        <Bullet key={bullet.id} position={bullet.position} />
      ))}
    </>
  );
};

export default Game;
