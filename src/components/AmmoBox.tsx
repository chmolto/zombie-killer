
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AmmoBoxProps {
  position: [number, number, number];
}

export const AmmoBox: React.FC<AmmoBoxProps> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      // Hover animation
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.1;
      // Spin animation
      groupRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Box */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#D3AB1C" />
      </mesh>
      
      {/* Bullets inside the box */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#B35900" />
      </mesh>
      
      {/* Decoration */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.55, 0.05, 0.55]} />
        <meshStandardMaterial color="#B38F1C" />
      </mesh>
      
      {/* Glowing effect */}
      <pointLight color="#ffc107" intensity={0.5} distance={2} />
    </group>
  );
};
