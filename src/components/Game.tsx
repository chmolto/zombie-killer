import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Ground } from './Ground';
import { Bullet } from './Bullet';
import { GameOverlay } from './GameOverlay';
import { Minimap } from './Minimap';
import { AmmoBox } from './AmmoBox';
import { useGameState } from '../hooks/useGameState';
import * as THREE from 'three';

export const Game = () => {
  const { 
    score, 
    gameOver, 
    lives,
    ammo,
    startGame, 
    resetGame 
  } = useGameState();

  return (
    <div className="w-full h-screen bg-game-bg relative">
      {!gameOver && (
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
          
          <GameScene />
        </Canvas>
      )}
      
      <GameOverlay
        score={score}
        lives={lives}
        gameOver={gameOver}
        ammo={ammo}
        onStart={startGame}
        onRestart={resetGame}
      />
    </div>
  );
};

const CameraController = ({ target }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    if (target.current) {
      const position = target.current.getPosition();
      // Maintain isometric view but follow player
      camera.position.x = position[0] + 8;
      camera.position.y = position[1] + 8;
      camera.position.z = position[2] + 8;
      camera.lookAt(position[0], position[1], position[2]);
    }
  });
  
  return null;
};

const GameScene = () => {
  const [enemies, setEnemies] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [bullets, setBullets] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number] }[]>([]);
  const [ammoBoxes, setAmmoBoxes] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const playerRef = useRef<any>(null);
  const enemyIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const ammoBoxIdRef = useRef(0);
  const gameAreaSize = 15;
  
  const { increaseScore, decreaseLives, useAmmo, addAmmo } = useGameState();

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

    const interval = setInterval(spawnEnemy, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const spawnAmmoBox = () => {
      const x = (Math.random() * 2 - 1) * gameAreaSize * 0.7;
      const z = (Math.random() * 2 - 1) * gameAreaSize * 0.7;
      
      setAmmoBoxes(prev => [
        ...prev, 
        { 
          id: ammoBoxIdRef.current++, 
          position: [x, 0.25, z] 
        }
      ]);
    };

    for (let i = 0; i < 3; i++) {
      spawnAmmoBox();
    }

    const interval = setInterval(spawnAmmoBox, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleShoot = (e: KeyboardEvent) => {
      if (e.key === ' ' && playerRef.current) {
        const canShoot = useAmmo();
        
        if (canShoot) {
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
      }
    };

    window.addEventListener('keydown', handleShoot);
    return () => window.removeEventListener('keydown', handleShoot);
  }, [useAmmo]);

  useFrame(() => {
    if (!playerRef.current) return;
    
    const playerPosition = playerRef.current.getPosition();
    
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
          const distanceFromCenter = Math.sqrt(
            bullet.position[0] * bullet.position[0] + 
            bullet.position[2] * bullet.position[2]
          );
          return distanceFromCenter < gameAreaSize;
        })
    );
    
    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => {
        const dirX = playerPosition[0] - enemy.position[0];
        const dirZ = playerPosition[2] - enemy.position[2];
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        if (length < 0.1) {
          decreaseLives();
          return null;
        }
        
        const speed = 0.02;
        const newX = enemy.position[0] + (dirX / length) * speed;
        const newZ = enemy.position[2] + (dirZ / length) * speed;
        
        return { 
          ...enemy, 
          position: [newX, enemy.position[1], newZ] as [number, number, number]
        };
      }).filter(Boolean) as typeof prev;
      
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
            increaseScore();
            remainingEnemies.splice(i, 1);
            remainingBullets.splice(j, 1);
            break;
          }
        }
      }
      
      setBullets(remainingBullets);
      return remainingEnemies;
    });
    
    setAmmoBoxes(prev => {
      return prev.filter(box => {
        const dx = playerPosition[0] - box.position[0];
        const dz = playerPosition[2] - box.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 1) {
          addAmmo(5);
          return false;
        }
        return true;
      });
    });
  });

  return (
    <>
      <Ground size={gameAreaSize} />
      <Player ref={playerRef} />
      <CameraController target={playerRef} />
      
      {enemies.map(enemy => (
        <Enemy key={enemy.id} position={enemy.position} />
      ))}
      
      {bullets.map(bullet => (
        <Bullet key={bullet.id} position={bullet.position} />
      ))}
      
      {ammoBoxes.map(box => (
        <AmmoBox key={box.id} position={box.position} />
      ))}
      
      <Minimap playerPosition={playerRef.current ? playerRef.current.getPosition() : [0, 0, 0]} 
               enemies={enemies} 
               ammoBoxes={ammoBoxes} />
    </>
  );
};

export default Game;
