
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
}

export const Bullet: React.FC<BulletProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.5} />
      <pointLight color="#F97316" intensity={1} distance={2} />
    </mesh>
  );
};
