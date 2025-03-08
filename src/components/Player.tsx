
import React, { useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PLAYER_SPEED = 0.075; // Half the original speed

export const Player = React.forwardRef<
  { getPosition: () => [number, number, number], getDirection: () => [number, number, number] },
  {}
>((props, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [rotation, setRotation] = useState<number>(0);
  const [direction, setDirection] = useState<[number, number, number]>([0, 0, 1]);
  const keys = useRef<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    getPosition: () => position,
    getDirection: () => direction
  }));

  // Track key presses
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
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
  }, []);

  // Move player based on key presses
  useFrame(({ clock }) => {
    let moveX = 0;
    let moveZ = 0;
    
    if (keys.current.has('w') || keys.current.has('arrowup')) moveZ -= PLAYER_SPEED;
    if (keys.current.has('s') || keys.current.has('arrowdown')) moveZ += PLAYER_SPEED;
    if (keys.current.has('a') || keys.current.has('arrowleft')) moveX -= PLAYER_SPEED;
    if (keys.current.has('d') || keys.current.has('arrowright')) moveX += PLAYER_SPEED;
    
    if (moveX !== 0 || moveZ !== 0) {
      // Calculate new position
      const newX = Math.max(-15, Math.min(15, position[0] + moveX));
      const newZ = Math.max(-15, Math.min(15, position[2] + moveZ));
      setPosition([newX, position[1], newZ]);
      
      // Calculate new direction and rotation
      const angle = Math.atan2(moveZ, moveX);
      setRotation(angle + Math.PI / 2);
      setDirection([Math.cos(angle), 0, Math.sin(angle)]);
    }
    
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.rotation.y = rotation;
      
      // Add slight bob animation for walking
      if (moveX !== 0 || moveZ !== 0) {
        const bobAmount = Math.sin(clock.getElapsedTime() * 5) * 0.05;
        groupRef.current.position.y = position[1] + bobAmount;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 1, 8]} />
        <meshStandardMaterial color="#9b87f5" />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#F5D0C5" />
      </mesh>
      
      {/* Arms */}
      <mesh castShadow position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#7069AB" />
      </mesh>
      <mesh castShadow position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#7069AB" />
      </mesh>
      
      {/* Legs */}
      <mesh castShadow position={[0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#5B50A5" />
      </mesh>
      <mesh castShadow position={[-0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#5B50A5" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
});

Player.displayName = 'Player';
