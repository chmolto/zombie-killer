
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Player } from './Player';
import { Ground } from './Ground';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { useGameState } from '../hooks/useGameState';
import { GameOverlay } from './GameOverlay';

export const Game: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [enemies, setEnemies] = useState<any[]>([]);
  const [ammoBoxes, setAmmoBoxes] = useState<any[]>([]);
  
  const { 
    score, 
    lives, 
    ammo, 
    round,
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
        <fog attach="fog" args={['#1A1F2C', 20, 60]} />
        
        <Suspense fallback={null}>
          <GameScene 
            playerPosition={playerPosition} 
            onPlayerMove={handlePlayerMove} 
            updateEnemies={updateEnemies}
            updateAmmoBoxes={updateAmmoBoxes}
          />
        </Suspense>
      </Canvas>
      
      <GameOverlay 
        score={score}
        lives={lives}
        gameOver={gameOver}
        ammo={ammo}
        round={round}
        onStart={startGame}
        onRestart={resetGame}
      />

      {/* Render minimap as a DOM element outside of the Three.js canvas */}
      <div className="absolute right-4 bottom-4 z-10 pointer-events-none">
        <div className="bg-black/50 p-2 rounded-md">
          <div className="text-white text-xs mb-1 text-center">Map</div>
          <div className="w-[150px] h-[150px] relative">
            {/* We'll use a simple 2D representation of game elements */}
            <div className="absolute inset-0 bg-green-900/70 rounded-md overflow-hidden">
              {/* Player marker */}
              <div 
                className="absolute w-2 h-2 bg-blue-500 rounded-full" 
                style={{ 
                  left: `${((playerPosition[0] / 40) + 0.5) * 100}%`, 
                  top: `${((playerPosition[2] / 40) + 0.5) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
              
              {/* Enemy markers */}
              {enemies.map((enemy, index) => (
                <div 
                  key={`minimap-enemy-${index}`}
                  className={`absolute w-1.5 h-1.5 ${enemy.isDying ? 'bg-gray-400' : 'bg-red-500'} rounded-full`}
                  style={{ 
                    left: `${((enemy.position[0] / 40) + 0.5) * 100}%`, 
                    top: `${((enemy.position[2] / 40) + 0.5) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
              
              {/* Ammo box markers */}
              {ammoBoxes.map((box, index) => (
                <div 
                  key={`minimap-ammo-${index}`}
                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-sm"
                  style={{ 
                    left: `${((box.position[0] / 40) + 0.5) * 100}%`, 
                    top: `${((box.position[2] / 40) + 0.5) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
              
              {/* Forest boundary indicator - circular border */}
              <div className="absolute inset-2 border-2 border-green-700/50 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Camera controller to follow the player
const CameraController = ({ target }: { target: React.RefObject<any> }) => {
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

// Game scene component - this is where all the 3D rendering happens
interface GameSceneProps {
  playerPosition: [number, number, number];
  onPlayerMove: (position: [number, number, number]) => void;
  updateEnemies: (enemies: any[]) => void;
  updateAmmoBoxes: (ammoBoxes: any[]) => void;
}

const GameScene: React.FC<GameSceneProps> = ({ 
  playerPosition, 
  onPlayerMove, 
  updateEnemies, 
  updateAmmoBoxes 
}) => {
  const [enemies, setEnemies] = useState<{ id: number; position: [number, number, number]; isDying?: boolean }[]>([]);
  const [bullets, setBullets] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number] }[]>([]);
  const [ammoBoxes, setAmmoBoxes] = useState<{ id: number; position: [number, number, number] }[]>([]);
  
  const playerRef = useRef<any>(null);
  const nextBulletId = useRef(1);
  const nextEnemyId = useRef(1);
  const nextAmmoBoxId = useRef(1);
  const gameAreaSize = 20;
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
    nextRound,
    enemyKilled,
    totalEnemiesForRound,
    enemiesKilled
  } = useGameState();
  
  // Debug logging for tracking round progression
  useEffect(() => {
    console.log(`[DEBUG] Round: ${round}, Enemies killed: ${enemiesKilled}/${totalEnemiesForRound}`);
  }, [round, enemiesKilled, totalEnemiesForRound]);
  
  // Compute current game state based on gameStarted and gameOver flags
  const gameState = gameOver ? 'gameOver' : (gameStarted ? 'playing' : 'waiting');
  
  // Track dying zombies to animate them before removing
  const [dyingEnemies, setDyingEnemies] = useState<{ id: number; position: [number, number, number]; deathTime: number }[]>([]);
  
  // Reference for manual key handling
  const keysPressed = useRef<Set<string>>(new Set());
  
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
    // Check if player can shoot
    if (!playerRef.current) {
      return;
    }
    
    // Use ammo
    const canShoot = useAmmo();
    if (!canShoot) {
      return;
    }
    
    // Get player position and direction
    const position = playerRef.current.getPosition();
    const direction = playerRef.current.getDirection();
    
    console.log('[DEBUG] Shoot function called');
    console.log('[DEBUG] Player position:', position);
    console.log('[DEBUG] Player direction:', direction);
    
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
      direction: [direction[0], 0, direction[2]] as [number, number, number]
    };
    
    console.log('[DEBUG] Created bullet:', newBullet);
    setBullets(prev => [...prev, newBullet]);
    
    // Trigger player shooting animation
    if (playerRef.current && playerRef.current.triggerShootAnimation) {
      playerRef.current.triggerShootAnimation();
      console.log('[DEBUG] Shooting animation triggered');
    }
  };
  
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
    if (gameState !== 'playing' || roundComplete) return;
    
    // Calculate how many enemies are still needed for this round
    const enemiesRemaining = totalEnemiesForRound - enemiesKilled;
    // Cap concurrent enemies based on round number, but don't exceed what's left for this round
    const maxConcurrentEnemies = Math.min(3 + Math.min(round, 10), enemiesRemaining - enemies.length);
    
    const spawnInterval = setInterval(() => {
      // Only spawn if we haven't reached the maximum concurrent enemies 
      // and we haven't spawned all enemies for this round
      if (enemies.length < maxConcurrentEnemies && enemies.length + enemiesKilled < totalEnemiesForRound) {
        // Random position on the edge of the game area
        const spawnRadius = gameAreaSize * 0.9; // Slightly inside the fog boundary
        const angle = Math.random() * Math.PI * 2;
        
        const position: [number, number, number] = [
          Math.cos(angle) * spawnRadius,
          0,
          Math.sin(angle) * spawnRadius
        ];
        
        setEnemies(prev => [
          ...prev,
          {
            id: nextEnemyId.current++,
            position
          }
        ]);
      }
    }, Math.max(2500 - (round * 200), 800)); // Spawn faster in higher rounds
    
    return () => clearInterval(spawnInterval);
  }, [gameState, enemies.length, round, roundComplete, enemiesKilled, totalEnemiesForRound]);
  
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
    if (gameState !== 'playing') return;
    
    // Update bullets (move them forward)
    setBullets(prev => {
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
        const speed = 0.02 + (round * 0.002); // Enemies get faster each round
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
    
    // Check for bullet-enemy collisions
    const allBullets = [...bullets];
    const allEnemies = [...enemies];
    const killedEnemies: typeof dyingEnemies = [];
    let bulletHits: number[] = [];
    let roundCompleteFlag = false;
    
    // Check each bullet against each enemy
    for (let i = 0; i < allBullets.length; i++) {
      const bullet = allBullets[i];
      
      for (let j = 0; j < allEnemies.length; j++) {
        const enemy = allEnemies[j];
        
        // Skip already dying enemies
        if (enemy.isDying) continue;
        
        // Calculate distance between bullet and enemy
        const dx = enemy.position[0] - bullet.position[0];
        const dz = enemy.position[2] - bullet.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If close enough, count as a hit
        if (distance < 1.0) {
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
          
          // Update the score
          increaseScore();
          
          // Check if round is complete after killing this enemy
          const isRoundComplete = enemyKilled();
          console.log(`[DEBUG] Hit! Bullet ${bullet.id} hit enemy ${enemy.id} at distance ${distance.toFixed(2)}`);
          
          if (isRoundComplete) {
            console.log('[DEBUG] Round complete! Starting next round.');
            roundCompleteFlag = true;
          }
          
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
    
    // Update enemies with dying status
    if (killedEnemies.length > 0) {
      setEnemies(allEnemies);
      setDyingEnemies(prev => [...prev, ...killedEnemies]);
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
    
    // Handle round completion
    if (roundCompleteFlag && !roundComplete) {
      setRoundComplete(true);
      setTimeout(() => {
        next

Round();
        setRoundComplete(false);
        // Clear all enemies when starting new round
        setEnemies([]);
        setDyingEnemies([]);
      }, 3000);
    }
    
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
      />
      
      <Ground size={gameAreaSize} isInfinite={true} />
      
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
          <meshStandardMaterial color="#FFD700" emissive="#FFAA00" emissiveIntensivity={0.5} />
        </mesh>
      ))}
    </>
  );
};

export default Game;
