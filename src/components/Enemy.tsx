
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnemyProps {
  position: [number, number, number];
}

export const Enemy: React.FC<EnemyProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPosition = useRef(position).current;
  
  // Animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      
      // Bob up and down
      const time = clock.getElapsedTime();
      meshRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.1;
      
      // Face movement direction
      if (meshRef.current.position.x !== initialPosition[0] || meshRef.current.position.z !== initialPosition[2]) {
        const dx = meshRef.current.position.x - initialPosition[0];
        const dz = meshRef.current.position.z - initialPosition[2];
        meshRef.current.rotation.y = Math.atan2(dx, dz);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <group>
        {/* Body */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.3, 0.7, 1, 8]} />
          <meshStandardMaterial color="#97F58B" />
        </mesh>
        
        {/* Arms */}
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
          <meshStandardMaterial color="#77D56B" />
        </mesh>
        <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
          <meshStandardMaterial color="#77D56B" />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[0.15, 0.4, 0.25]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh position={[-0.15, 0.4, 0.25]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    </mesh>
  );
};
