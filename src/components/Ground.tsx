import React, { useMemo } from 'react';
import * as THREE from 'three';

interface GroundProps {
  size: number;
}

export const Ground: React.FC<GroundProps> = ({ size }) => {
  // Generate trees and rocks only once using useMemo
  const forestElements = useMemo(() => {
    const elements = [];
    
    // Dense outer ring of trees
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = size * 0.8 + Math.random() * 1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.7 + Math.random() * 0.8;
      
      elements.push(
        <group key={`outer-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree />
        </group>
      );
    }
    
    // Scattered inner trees
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.5 + Math.random() * 0.7;
      
      // Don't place trees too close to center
      if (Math.sqrt(x*x + z*z) > 3) {
        elements.push(
          <group key={`inner-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
            <Tree />
          </group>
        );
      }
    }
    
    // Scattered rocks
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.3 + Math.random() * 0.4;
      
      elements.push(
        <group key={`rock-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Rock />
        </group>
      );
    }
    
    return elements;
  }, []); // Empty dependency array ensures this runs only once

  return (
    <group>
      {/* Main ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#3d5229" />
      </mesh>
      
      {/* Subtle grid for gameplay reference */}
      <gridHelper args={[size * 2, size * 2, '#465c31', '#465c31']} position={[0, 0.02, 0]} />
      
      {/* Forest elements */}
      {forestElements}
    </group>
  );
};

const Tree = () => {
  // Randomize tree appearance
  const trunkHeight = 0.5 + Math.random() * 0.5;
  const trunkWidth = 0.15 + Math.random() * 0.1;
  const treeType = Math.random();

  return (
    <group>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkWidth, trunkWidth * 1.2, trunkHeight, 6]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      
      {treeType > 0.7 ? (
        // Pine tree
        <>
          <mesh position={[0, trunkHeight + 0.6, 0]} castShadow>
            <coneGeometry args={[0.7, 1.2, 6]} />
            <meshStandardMaterial color="#2d3b20" />
          </mesh>
          <mesh position={[0, trunkHeight + 1.2, 0]} castShadow>
            <coneGeometry args={[0.5, 0.8, 6]} />
            <meshStandardMaterial color="#2d3b20" />
          </mesh>
          <mesh position={[0, trunkHeight + 1.6, 0]} castShadow>
            <coneGeometry args={[0.3, 0.6, 6]} />
            <meshStandardMaterial color="#2d3b20" />
          </mesh>
        </>
      ) : (
        // Deciduous tree
        <mesh position={[0, trunkHeight + 0.8, 0]} castShadow>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#4a682c" />
        </mesh>
      )}
    </group>
  );
};

const Rock = () => {
  const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
  return (
    <mesh rotation={rotation as [number, number, number]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#7d7d7d" />
    </mesh>
  );
};
