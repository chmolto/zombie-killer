import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './Player';
import { Ground } from './Ground';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { useGameState } from '../hooks/useGameState';
import { GameOverlay } from './GameOverlay';
import { Minimap } from './Minimap';
import { MobileControls } from './MobileControls';

export const Game: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [playerDirection, setPlayerDirection] = useState<[number, number, number]>([0, 0, 1]);
  const [enemies, setEnemies] = useState<any[]>([]);
  const [ammoBoxes, setAmmoBoxes] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  // Mobile controls state
  const [mobileDirection, setMobileDirection] = useState<[number, number]>([0, 0]);
  
  const { 
    score, 
    lives, 
    ammo, 
    gameOver,
    gameStarted,
    startGame,
    resetGame
  } = useGameState();
  
  // Handle player movement
  const handlePlayerMove = (position: [number, number, number]) => {
    setPlayerPosition(position);
  };
  
  // Update enemy positions
  const updateEnemies = (newEnemies: any[]) => {
    setEnemies(newEnemies);
  };
  
  // Update ammo boxes
  const updateAmmoBoxes = (newAmmoBoxes: any[]) => {
    setAmmoBoxes(newAmmoBoxes);
  };
  
  return (
    <div className="game-container h-screen w-screen">
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
        
        <GameScene 
          playerPosition={playerPosition} 
          onPlayerMove={handlePlayerMove} 
          updateEnemies={updateEnemies}
          updateAmmoBoxes={updateAmmoBoxes}
          isPaused={isPaused}
          mobileDirection={mobileDirection}
        />
      </Canvas>
      
      <GameOverlay 
        score={score}
        lives={lives}
        gameOver={gameOver}
        ammo={ammo}
        onStart={startGame}
        onRestart={resetGame}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />
      
      {/* Add Minimap to the game UI when game is active */}
      {gameStarted && !gameOver && (
        <Minimap 
          playerPosition={playerPosition} 
          enemies={enemies} 
          ammoBoxes={ammoBoxes}
        />
      )}
      
      {/* Mobile Controls */}
      <MobileControls 
        onMove={(x, y) => setMobileDirection([x, y])}
        onShoot={() => {
          // This is a proxy function that will be called by the mobile controls
          // We can't directly access the shoot function from the GameScene
          // So we'll use a custom event to trigger it
          const shootEvent = new CustomEvent('mobile-shoot');
          window.dispatchEvent(shootEvent);
        }}
      />
    </div>
  );
};

// Game scene component - this is where all the 3D rendering happens
interface GameSceneProps {
  playerPosition: [number, number, number];
  onPlayerMove: (position: [number, number, number]) => void;
  updateEnemies: (enemies: any[]) => void;
  updateAmmoBoxes: (ammoBoxes: any[]) => void;
  isPaused: boolean;
  mobileDirection: [number, number];
}

// Camera controller to follow the player
const CameraController = ({ target }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    if (!target.current) return;
    
    const position = target.current.getPosition();
    
    // Position camera at an offset from the player
    camera.position.x = position[0] + 8;
    camera.position.y = position[1] + 8;
    camera.position.z = position[2] + 8;
    
    // Look at player
    camera.lookAt(position[0], position[1], position[2]);
  });
  
  return null;
};

const GameScene: React.FC<GameSceneProps> = ({ 
  playerPosition, 
  onPlayerMove, 
  updateEnemies, 
  updateAmmoBoxes,
  isPaused,
  mobileDirection
}) => {
  const [enemies, setEnemies] = useState<{ id: number; position: [number, number, number]; isDying?: boolean }[]>([]);
  const [bullets, setBullets] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number] }[]>([]);
  const [ammoBoxes, setAmmoBoxes] = useState<{ id: number; position: [number, number, number] }[]>([]);
  
  const playerRef = useRef<{
    getPosition: () => [number, number, number];
    getDirection: () => [number, number, number];
    triggerShootAnimation: () => void;
  }>(null);
  const nextBulletId = useRef(1);
  const nextEnemyId = useRef(1);
  const nextAmmoBoxId = useRef(1);
  const gameAreaSize = 20;
  const [enemyCount, setEnemyCount] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  
  // Access global game state
  const { 
    gameOver,
    gameStarted,
    increaseScore, 
    decreaseLives, 
    addAmmo, 
    useAmmo,
    round,
    nextRound
  } = useGameState();
  
  // Compute current game state based on gameStarted and gameOver flags
  const gameState = gameOver ? 'gameOver' : (gameStarted ? 'playing' : 'waiting');
  
  // Track dying zombies to animate them before removing
  const [dyingEnemies, setDyingEnemies] = useState<{ id: number; position: [number, number, number]; deathTime: number }[]>([]);
  
  // Reference for manual key handling
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Mobile controls state
  const [mobileDirectionState, setMobileDirectionState] = useState<[number, number]>([0, 0]);
  
  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      if (gameState === 'playing' && e.code === 'Space') {
        shoot();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);
  
  // Create a bullet when player shoots
  const shoot = () => {
    console.log("[DEBUG] Shoot function called");
    
    // Check if player can shoot
    if (!playerRef.current) {
      console.log("[DEBUG] Cannot shoot - no player ref");
      return;
    }
    
    // Use ammo
    const canShoot = useAmmo();
    if (!canShoot) {
      console.log("[DEBUG] Cannot shoot - useAmmo returned false");
      return;
    }
    
    // Get player position and direction
    const position = playerRef.current.getPosition();
    const direction = playerRef.current.getDirection();
    
    console.log("[DEBUG] Player position:", position);
    console.log("[DEBUG] Player direction:", direction);
    
    // Start bullet slightly in front of player (avoid self-collision)
    const bulletPosition: [number, number, number] = [
      position[0] + direction[0] * 0.7, // Start in front of player
      position[1] + 0.5,                // At gun height
      position[2] + direction[2] * 0.7  // Start in front of player
    ];
    
    // Create the bullet
    const newBullet = {
      id: nextBulletId.current++,
      position: bulletPosition,
      direction: [direction[0], 0, -direction[2]] as [number, number, number] // Fix Y-axis direction by inverting Z component
    };
    
    console.log("[DEBUG] Created bullet:", newBullet);
    setBullets(prev => [...prev, newBullet]);
    
    // Trigger player shooting animation
    if (playerRef.current && playerRef.current.triggerShootAnimation) {
      playerRef.current.triggerShootAnimation();
    }
  };
  
  // Listen for mobile shoot event
  useEffect(() => {
    const handleMobileShoot = () => {
      shoot();
    };
    
    window.addEventListener('mobile-shoot', handleMobileShoot);
    
    return () => {
      window.removeEventListener('mobile-shoot', handleMobileShoot);
    };
  }, []);
  
  // Clean up dying zombies after animation completes
  useEffect(() => {
    const interval = setInterval(() => {
      if (dyingEnemies.length > 0) {
        const now = Date.now();
        setDyingEnemies(prev => 
          prev.filter(enemy => now - enemy.deathTime < 1500) // 1.5 seconds animation
        );
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Spawn enemies periodically
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const maxEnemies = 3 + (round * 2); // Increase enemies per round
    const totalEnemiesForRound = 5 + (round * 3); // Total enemies to spawn in this round
    
    const spawnInterval = setInterval(() => {
      // Only spawn if we haven't reached the maximum concurrent enemies
      // and haven't spawned all enemies for this round
      if (enemies.length < maxEnemies && enemyCount < totalEnemiesForRound) {
        // Random position on the edge of the game area
        const edge = Math.random() < 0.5 ? -1 : 1;
        const side = Math.random() < 0.5;
        
        const position: [number, number, number] = side
          ? [edge * gameAreaSize * 0.8, 0, (Math.random() * 2 - 1) * gameAreaSize * 0.8]
          : [(Math.random() * 2 - 1) * gameAreaSize * 0.8, 0, edge * gameAreaSize * 0.8];
        
        setEnemies(prev => [
          ...prev,
          {
            id: nextEnemyId.current++,
            position
          }
        ]);
        
        // Increment the enemy count
        setEnemyCount(prev => prev + 1);
      }
    }, Math.max(3000 - (round * 200), 800)); // Spawn faster in higher rounds
    
    return () => clearInterval(spawnInterval);
  }, [gameState, enemies.length, enemyCount, round, dyingEnemies.length]);
  
  // Separate effect to check for round completion outside the spawn interval
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const totalEnemiesForRound = 2 + (round * 3);
    
    // Debug logging to help identify the issue
    console.log(`[DEBUG] Round status: round=${round}, enemyCount=${enemyCount}, enemies=${enemies.length}, dyingEnemies=${dyingEnemies.length}, totalNeeded=${totalEnemiesForRound}`);
    
    // Modified condition: If we've spawned ALL enemies for this round AND there are no more alive enemies
    if (enemyCount >= totalEnemiesForRound && enemies.length === 0) {
      console.log("[DEBUG] Round complete! Starting next round soon...");
      // Force a delay before marking round as complete to ensure all death animations are processed
      setTimeout(() => {
        setRoundComplete(true);
      }, 1000);
    }
  }, [gameState, enemyCount, enemies.length, dyingEnemies.length, round]);
  
  // Start next round after a delay
  useEffect(() => {
    if (gameState !== 'playing' || !roundComplete) return;
    
    console.log("[DEBUG] Starting next round timer");
    
    const timer = setTimeout(() => {
      console.log("[DEBUG] Next round starting now!");
      nextRound();
      setRoundComplete(false);
      setEnemyCount(0); // Reset enemy count to ensure proper tracking for the new round
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [gameState, roundComplete]);
  
  // Spawn ammo boxes periodically
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const spawnInterval = setInterval(() => {
      if (ammoBoxes.length < 3 && Math.random() < 0.3) {
        // Random position in the game area
        const position: [number, number, number] = [
          (Math.random() * 2 - 1) * gameAreaSize * 0.7,
          0,
          (Math.random() * 2 - 1) * gameAreaSize * 0.7
        ];
        
        setAmmoBoxes(prev => [
          ...prev,
          {
            id: nextAmmoBoxId.current++,
            position
          }
        ]);
      }
    }, 5000);
    
    return () => clearInterval(spawnInterval);
  }, [gameState, ammoBoxes.length]);
  
  // Game logic updates
  useFrame(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    // Update bullets (move them forward)
    setBullets(prev => {
      // Skip updates if no bullets to process
      if (prev.length === 0) return prev;
      
      const updatedBullets = prev.map(bullet => {
        // Move bullet in its direction
        const speed = 0.5; // Speed of bullet movement
        return {
          ...bullet,
          position: [
            bullet.position[0] + bullet.direction[0] * speed,
            bullet.position[1],
            bullet.position[2] + bullet.direction[2] * speed
          ] as [number, number, number]
        };
      });
      
      // Remove bullets that are too far away
      return updatedBullets.filter(bullet => {
        const distanceFromCenter = Math.sqrt(
          bullet.position[0] * bullet.position[0] + 
          bullet.position[2] * bullet.position[2]
        );
        return distanceFromCenter < gameAreaSize;
      });
    });
    
    // Update enemies (move them toward player)
    setEnemies(prev => {
      // Skip updates if no enemies to process
      if (prev.length === 0) return prev;
      
      const updatedEnemies = prev.map(enemy => {
        // Skip updating dying enemies
        if (enemy.isDying) return enemy;
        
        // Calculate direction to player
        const dirX = playerPosition[0] - enemy.position[0];
        const dirZ = playerPosition[2] - enemy.position[2];
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // If enemy is too close to player, damage player
        if (length < 0.8) {
          decreaseLives();
          return null; // Remove this enemy
        }
        
        // Move enemy toward player
        const speed = 0.02;
        return { 
          ...enemy, 
          position: [
            enemy.position[0] + (dirX / length) * speed,
            enemy.position[1],
            enemy.position[2] + (dirZ / length) * speed
          ] as [number, number, number]
        };
      }).filter(Boolean) as typeof prev;
      
      return updatedEnemies;
    });
    
    // Check for bullet-enemy collisions - only if both bullets and enemies exist
    if (bullets.length > 0 && enemies.length > 0) {
      const allBullets = [...bullets];
      const allEnemies = [...enemies];
      const killedEnemies: typeof dyingEnemies = [];
      let bulletHits: number[] = [];
      
      // Use a more efficient collision detection approach
      for (let i = 0; i < allBullets.length; i++) {
        const bullet = allBullets[i];
        
        for (let j = 0; j < allEnemies.length; j++) {
          const enemy = allEnemies[j];
          
          // Skip already dying enemies
          if (enemy.isDying) continue;
          
          // Use squared distance for performance (avoid sqrt)
          const dx = enemy.position[0] - bullet.position[0];
          const dz = enemy.position[2] - bullet.position[2];
          const distanceSquared = dx * dx + dz * dz;
          
          // If close enough, count as a hit (1.0^2 = 1.0)
          if (distanceSquared < 1.0) {
            // Mark enemy as dying
            allEnemies[j] = {
              ...enemy,
              isDying: true
            };
            
            // Track bullet for removal
            bulletHits.push(bullet.id);
            
            // Add to dying enemies list
            killedEnemies.push({
              id: enemy.id,
              position: enemy.position,
              deathTime: Date.now()
            });
            
            // Increase score
            increaseScore();
            
            break; // Stop checking this bullet
          }
        }
      }
      
      // Remove bullets that hit enemies
      if (bulletHits.length > 0) {
        setBullets(prev => 
          prev.filter(bullet => !bulletHits.includes(bullet.id))
        );
      }
      
      // Update enemies and add dying enemies
      if (killedEnemies.length > 0) {
        setEnemies(prev => 
          prev.map(enemy => {
            const dyingEnemy = killedEnemies.find(e => e.id === enemy.id);
            if (dyingEnemy) {
              return { ...enemy, isDying: true };
            }
            return enemy;
          })
        );
        
        setDyingEnemies(prev => [...prev, ...killedEnemies]);
      }
    }
    
    // Check for ammo box collection
    setAmmoBoxes(prev => {
      return prev.filter(box => {
        const dx = playerPosition[0] - box.position[0];
        const dz = playerPosition[2] - box.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 1) {
          // Player collected ammo box
          addAmmo(5);
          return false;
        }
        
        return true;
      });
    });
    
    // Update game state in parent
    onPlayerMove(playerRef.current ? playerRef.current.getPosition() : [0, 0, 0]);
    updateEnemies([...enemies, ...dyingEnemies.map(e => ({ id: e.id, position: e.position, isDying: true }))]);
    updateAmmoBoxes(ammoBoxes);
  });
  
  return (
    <>
      <CameraController target={playerRef} />
      <Player 
        ref={playerRef}
        onPositionChange={onPlayerMove}
        onDirectionChange={() => {}}
        mobileDirection={mobileDirection}
      />
      
      <Ground size={gameAreaSize} />
      
      {/* Render bullets */}
      {bullets.map(bullet => (
        <Bullet
          key={`bullet-${bullet.id}`}
          position={bullet.position}
        />
      ))}
      
      {/* Render enemies */}
      {enemies.map(enemy => (
        <Enemy
          key={`enemy-${enemy.id}`}
          position={enemy.position}
          isDying={enemy.isDying}
        />
      ))}
      
      {/* Render dying enemies (for death animation) */}
      {dyingEnemies.map(enemy => (
        <Enemy
          key={`dying-enemy-${enemy.id}`}
          position={enemy.position}
          isDying={true}
        />
      ))}
      
      {/* Render ammo boxes */}
      {ammoBoxes.map(box => (
        <mesh
          key={`ammo-${box.id}`}
          position={box.position}
          castShadow
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFAA00" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </>
  );
};

export default Game;
