
import React from 'react';
import * as THREE from 'three';

interface GroundProps {
  size: number;
}

export const Ground: React.FC<GroundProps> = ({ size }) => {
  return (
    <group>
      {/* Main ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#403E43" />
      </mesh>
      
      {/* Grid lines */}
      <gridHelper args={[size * 2, size * 2, '#333333', '#333333']} />
      
      {/* Environment details - trees and rocks */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = size * 0.7 + Math.random() * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.5 + Math.random() * 1;
        
        return (
          <group key={i} position={[x, 0, z]} scale={[scale, scale, scale]}>
            {Math.random() > 0.5 ? (
              // Tree
              <>
                <mesh position={[0, 1, 0]}>
                  <coneGeometry args={[0.5, 1.5, 6]} />
                  <meshStandardMaterial color="#6E59A5" />
                </mesh>
                <mesh position={[0, 0.25, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
                  <meshStandardMaterial color="#7E69AB" />
                </mesh>
              </>
            ) : (
              // Rock
              <mesh>
                <octahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="#555555" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
