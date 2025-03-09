import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
}

export const Bullet: React.FC<BulletProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startPosition = useRef<[number, number, number]>(position);
  
  // Store initial position when bullet is created
  if (!startPosition.current) {
    startPosition.current = [...position] as [number, number, number];
  }
  
  useFrame(() => {
    if (meshRef.current) {
      // Set bullet position
      meshRef.current.position.set(position[0], position[1], position[2]);
      
      // Simple rotation for visual effect (reduced complexity)
      meshRef.current.rotation.x += 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <sphereGeometry args={[0.25, 8, 8]} /> {/* Reduced geometry complexity */}
      <meshStandardMaterial color="#FF5500" emissive="#FF5500" emissiveIntensity={2} />
    </mesh>
  );
};
