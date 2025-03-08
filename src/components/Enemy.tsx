
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnemyProps {
  position: [number, number, number];
}

export const Enemy: React.FC<EnemyProps> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialPosition = useRef(position).current;
  
  // Animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      
      // Bob up and down and stagger like a zombie
      const time = clock.getElapsedTime();
      groupRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.1;
      groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.1; // Zombie stagger
      
      // Face movement direction
      if (groupRef.current.position.x !== initialPosition[0] || groupRef.current.position.z !== initialPosition[2]) {
        const dx = groupRef.current.position.x - initialPosition[0];
        const dz = groupRef.current.position.z - initialPosition[2];
        groupRef.current.rotation.y = Math.atan2(dx, dz);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      castShadow
      receiveShadow
    >
      {/* Zombie Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 1, 8]} />
        <meshStandardMaterial color="#97F58B" />
      </mesh>
      
      {/* Zombie Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#77D56B" />
      </mesh>
      
      {/* Arms - outstretched zombie style */}
      <mesh position={[0.4, 0.2, 0.2]} rotation={[0.5, 0, -Math.PI / 3]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#77D56B" />
      </mesh>
      <mesh position={[-0.4, 0.2, 0.2]} rotation={[0.5, 0, Math.PI / 3]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#77D56B" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#579C4D" />
      </mesh>
      <mesh position={[-0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 8]} />
        <meshStandardMaterial color="#579C4D" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Tattered clothes */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#3D5E35" />
      </mesh>
    </group>
  );
};
