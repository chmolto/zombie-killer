import React, { useRef, useImperativeHandle, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PLAYER_SPEED = 0.075; // Speed constant

interface PlayerProps {
  onPositionChange?: (position: [number, number, number]) => void;
  onDirectionChange?: (direction: [number, number, number]) => void;
  mobileDirection?: [number, number]; // Add mobile direction prop
}

export const Player = React.forwardRef<
  { 
    getPosition: () => [number, number, number], 
    getDirection: () => [number, number, number],
    triggerShootAnimation: () => void
  },
  PlayerProps
>((props, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [rotation, setRotation] = useState<number>(0);
  const [direction, setDirection] = useState<[number, number, number]>([0, 0, 1]);
  const keys = useRef<Set<string>>(new Set());
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [canShoot, setCanShoot] = useState<boolean>(true);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const gunRef = useRef<THREE.Group>(null);
  const isMoving = useRef<boolean>(false);
  const lastShotTime = useRef(0);
  const SHOT_COOLDOWN = 1; // 1 second cooldown between shots

  useImperativeHandle(ref, () => ({
    getPosition: () => position,
    getDirection: () => direction,
    triggerShootAnimation: () => {
      console.log("[DEBUG] Shooting animation triggered");
      // Only allow shooting if cooldown has elapsed
      const now = Date.now();
      if (now - lastShotTime.current > SHOT_COOLDOWN * 1000) {
        setIsShooting(true);
        lastShotTime.current = now;
        
        // Reset shooting state after short animation duration
        setTimeout(() => setIsShooting(false), 200);
      }
    }
  }));

  // Track key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      
      // Handle shooting with spacebar
      if (e.key === ' ' && canShoot) {
        setIsShooting(true);
        setCanShoot(false);
        
        // Reset shooting animation after 300ms
        setTimeout(() => {
          setIsShooting(false);
        }, 300);
        
        // Add cooldown between shots (1 second)
        setTimeout(() => {
          setCanShoot(true);
        }, 1000);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canShoot]);

  // Move player based on key presses
  useFrame(({ clock }) => {
    let moveX = 0;
    let moveZ = 0;
    
    // Fix Y-axis movement direction again
    if (keys.current.has('w') || keys.current.has('arrowup')) moveZ -= PLAYER_SPEED;
    if (keys.current.has('s') || keys.current.has('arrowdown')) moveZ += PLAYER_SPEED;
    if (keys.current.has('a') || keys.current.has('arrowleft')) moveX -= PLAYER_SPEED;
    if (keys.current.has('d') || keys.current.has('arrowright')) moveX += PLAYER_SPEED;
    
    // Update movement based on mobile direction input
    if (props.mobileDirection) {
      const [mobileX, mobileY] = props.mobileDirection;
      if (Math.abs(mobileX) > 0.1 || Math.abs(mobileY) > 0.1) {
        moveX += mobileX * PLAYER_SPEED * 1.5; // Slightly faster for mobile
        moveZ += mobileY * PLAYER_SPEED * 1.5;
      }
    }
    
    isMoving.current = moveX !== 0 || moveZ !== 0;
    
    if (isMoving.current) {
      // Normalize diagonal movement to prevent faster diagonal speed
      if (moveX !== 0 && moveZ !== 0) {
        const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX = (moveX / magnitude) * PLAYER_SPEED;
        moveZ = (moveZ / magnitude) * PLAYER_SPEED;
      }
      
      // Calculate new position
      const newX = Math.max(-15, Math.min(15, position[0] + moveX));
      const newZ = Math.max(-15, Math.min(15, position[2] + moveZ));
      setPosition([newX, position[1], newZ]);
      
      // Fixed direction for Y-axis movement
      const angle = Math.atan2(-moveZ, moveX); // Negate moveZ to fix Y-axis facing direction
      setRotation(angle + Math.PI / 2);
      setDirection([Math.cos(angle), 0, Math.sin(angle)]);
    }
    
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.rotation.y = rotation;
      
      // Enhanced walking animation with limb movement
      if (isMoving.current) {
        const walkCycle = clock.getElapsedTime() * 5;
        
        // Bob up and down while walking
        const bobAmount = Math.sin(walkCycle) * 0.05;
        groupRef.current.position.y = position[1] + bobAmount;
        
        // Animate legs
        if (rightLegRef.current && leftLegRef.current) {
          rightLegRef.current.rotation.x = Math.sin(walkCycle) * 0.4;
          leftLegRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.4;
        }
        
        // Animate arms slightly when walking
        if (rightArmRef.current && leftArmRef.current && !isShooting) {
          rightArmRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.2;
          leftArmRef.current.rotation.x = Math.sin(walkCycle) * 0.2;
        }
      } else {
        // Reset animations when not moving
        if (rightLegRef.current && leftLegRef.current) {
          rightLegRef.current.rotation.x = 0;
          leftLegRef.current.rotation.x = 0;
        }
        
        if (rightArmRef.current && leftArmRef.current && !isShooting) {
          rightArmRef.current.rotation.x = 0;
          leftArmRef.current.rotation.x = 0;
        }
      }
      
      // Shooting animation
      if (rightArmRef.current) {
        if (isShooting) {
          // Raise arm for shooting
          rightArmRef.current.rotation.x = -0.8;
        } else if (!isMoving.current) {
          // Reset arm when not shooting and not moving
          rightArmRef.current.rotation.x = 0;
        }
      }
      
      // Gun animation
      if (gunRef.current) {
        if (isShooting) {
          // Gun recoil animation
          gunRef.current.rotation.x = -Math.PI / 3 + Math.sin(clock.getElapsedTime() * 30) * 0.1;
          gunRef.current.position.z = 0.4 - Math.abs(Math.sin(clock.getElapsedTime() * 30) * 0.05);
        } else {
          // Reset gun when not shooting
          gunRef.current.rotation.x = 0;
          gunRef.current.position.z = 0.4;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.7, 1, 16]} />
        <meshStandardMaterial color="#4285F4" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#4285F4" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Face details */}
      <mesh position={[0, 0.7, 0.2]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.1]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.1, 0.75, 0.22]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.1, 0.75, 0.22]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.4, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#3B71CA" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Right arm positioned to hold a gun */}
      <mesh ref={rightArmRef} position={[0.4, 0.2, 0]} rotation={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#3B71CA" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Gun model */}
      <group ref={gunRef} position={[0.35, 0.15, 0.25]} rotation={[0, Math.PI/16, 0]}>
        {/* Gun barrel */}
        <mesh position={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.6]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.8} />
        </mesh>
        
        {/* Barrel tip - muzzle */}
        <mesh position={[0, 0, 0.55]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.1, 8]} />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.7} />
        </mesh>
        
        {/* Gun body */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.3]} />
          <meshStandardMaterial color="#444444" roughness={0.3} metalness={0.9} />
        </mesh>
        
        {/* Gun handle */}
        <mesh position={[0, -0.22, -0.05]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.5} />
        </mesh>
        
        {/* Gun sight */}
        <mesh position={[0, 0.08, 0.1]} castShadow>
          <boxGeometry args={[0.02, 0.04, 0.06]} />
          <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Muzzle flash - only visible during shooting */}
        {isShooting && (
          <group position={[0, 0, 0.6]}>
            <pointLight color="#FF9500" intensity={5} distance={3} decay={2} />
            <mesh rotation={[0, 0, Math.random() * Math.PI * 2]}>
              <coneGeometry args={[0.2, 0.4, 16, 1, true]} />
              <meshBasicMaterial color="#FFDD00" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Legs */}
      <mesh ref={rightLegRef} position={[0.15, -0.5, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#3B71CA" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.15, -0.5, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#3B71CA" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Shoes */}
      <mesh position={[0.15, -0.85, 0.1]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.3]} />
        <meshStandardMaterial color="#222222" roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, -0.85, 0.1]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.3]} />
        <meshStandardMaterial color="#222222" roughness={0.9} />
      </mesh>
    </group>
  );
});

Player.displayName = 'Player';
