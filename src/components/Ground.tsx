import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface GroundProps {
  size: number;
}

export const Ground: React.FC<GroundProps> = ({ size }) => {
  // We'll multiply the size to make the map bigger
  const expandedSize = size * 1.5;
  
  // Load and configure textures for more realistic ground
  const grassTexture = useTexture('/textures/grass.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(expandedSize / 5, expandedSize / 5);
  });
  
  // Generate trees and rocks only once using useMemo
  const forestElements = useMemo(() => {
    const elements = [];
    
    // Dense outer ring of trees - create a thicker forest wall
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      const radius = expandedSize * 0.85 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.7 + Math.random() * 0.8;
      
      elements.push(
        <group key={`outer-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree />
        </group>
      );
    }
    
    // Secondary outer ring for depth
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() * 0.1);
      const radius = expandedSize * 0.75 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.6 + Math.random() * 0.7;
      
      elements.push(
        <group key={`mid-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree />
        </group>
      );
    }
    
    // Scattered inner trees
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * expandedSize * 0.7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.5 + Math.random() * 0.7;
      
      // Don't place trees too close to center
      if (Math.sqrt(x*x + z*z) > 4) {
        elements.push(
          <group key={`inner-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
            <Tree />
          </group>
        );
      }
    }
    
    // Scattered rocks
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * expandedSize * 0.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.3 + Math.random() * 0.4;
      
      elements.push(
        <group key={`rock-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Rock />
        </group>
      );
    }
    
    // Add grass tufts for ground detail
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * expandedSize * 0.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.2 + Math.random() * 0.3;
      
      elements.push(
        <group key={`grass-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <GrassTuft />
        </group>
      );
    }
    
    // Create outer fog trees - these will create the illusion of endless forest
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const radius = expandedSize * 0.95 + Math.random() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.8 + Math.random() * 1.2;
      
      elements.push(
        <group key={`fog-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree fogTree={true} />
        </group>
      );
    }
    
    return elements;
  }, [expandedSize]); // Update when expandedSize changes

  return (
    <group>
      {/* Larger ground plane with texture */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[expandedSize * 3, expandedSize * 3, 32, 32]} />
        <meshStandardMaterial 
          map={grassTexture} 
          color="#4a6234" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Distant ground plane for horizon effect */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[expandedSize * 6, expandedSize * 6]} />
        <meshStandardMaterial color="#3d5229" opacity={0.9} transparent={true} />
      </mesh>
      
      {/* Forest elements */}
      {forestElements}
    </group>
  );
};

const Tree = ({ fogTree = false }) => {
  // Randomize tree appearance
  const trunkHeight = 0.5 + Math.random() * 0.5;
  const trunkWidth = 0.15 + Math.random() * 0.1;
  const treeType = Math.random();
  
  // For fog trees use a darker material to create depth illusion
  const foliageColor = fogTree ? "#263219" : "#3a5229";
  const trunkColor = fogTree ? "#3d2c1e" : "#795548";

  return (
    <group>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkWidth, trunkWidth * 1.2, trunkHeight, 6]} />
        <meshStandardMaterial color={trunkColor} />
      </mesh>
      
      {treeType > 0.7 ? (
        // Pine tree
        <>
          <mesh position={[0, trunkHeight + 0.6, 0]} castShadow>
            <coneGeometry args={[0.6, 1.2, 6]} />
            <meshStandardMaterial color={foliageColor} />
          </mesh>
          <mesh position={[0, trunkHeight + 1.2, 0]} castShadow>
            <coneGeometry args={[0.4, 0.8, 6]} />
            <meshStandardMaterial color={foliageColor} />
          </mesh>
        </>
      ) : (
        // Regular tree with foliage
        <mesh position={[0, trunkHeight + 0.45, 0]} castShadow>
          <sphereGeometry args={[0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          <meshStandardMaterial color={foliageColor} />
        </mesh>
      )}
    </group>
  );
};

const Rock = () => {
  // Randomize rock shape
  const rockWidth = 0.6 + Math.random() * 0.4;
  const rockHeight = 0.3 + Math.random() * 0.2;
  
  return (
    <mesh position={[0, rockHeight / 2, 0]} rotation={[0, Math.random() * Math.PI, 0]} castShadow receiveShadow>
      <boxGeometry args={[rockWidth, rockHeight, rockWidth]} />
      <meshStandardMaterial color="#666666" roughness={0.9} />
    </mesh>
  );
};

// Simple grass tuft for additional ground detail
const GrassTuft = () => {
  return (
    <mesh position={[0, 0.1, 0]} castShadow>
      <coneGeometry args={[0.2, 0.4, 3]} />
      <meshStandardMaterial color="#567d3e" />
    </mesh>
  );
};
