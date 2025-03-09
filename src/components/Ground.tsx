import React, { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, MeshStandardMaterial } from 'three';

interface GroundProps {
  size: number;
  isInfinite?: boolean;
}

export const Ground: React.FC<GroundProps> = ({ size, isInfinite = false }) => {
  // Generate repeating grass texture materials
  const grassMaterial = useMemo(() => {
    // Create a procedural grass texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Base color - darker and more natural
      context.fillStyle = '#2d3b20';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add noise and variation for more natural look
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        
        // Random grass shades - more natural palette
        const shade = Math.random();
        
        if (shade < 0.25) {
          context.fillStyle = '#2d3b20'; // Dark base
        } else if (shade < 0.5) {
          context.fillStyle = '#3d4c2a'; // Medium dark
        } else if (shade < 0.75) {
          context.fillStyle = '#4a5a32'; // Medium light
        } else {
          context.fillStyle = '#576838'; // Light accent
        }
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      
      // Add subtle grass blade details
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = 2 + Math.random() * 4;
        const width = 0.5 + Math.random() * 1;
        const angle = Math.random() * Math.PI;
        
        context.fillStyle = '#5a7832';
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillRect(-width/2, -length/2, width, length);
        context.restore();
      }
    }
    
    // Create texture from canvas
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(20, 20); // Increased repeat for more detail
    
    // Create material with the texture
    const material = new MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1
    });
    
    return material;
  }, []);
  
  // Generate forest elements around player
  const forestElements = useMemo(() => {
    const elements = [];
    const forestRadius = isInfinite ? size * 2 : size;
    
    // Dense outer ring of trees
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = forestRadius * 0.85 + Math.random() * 0.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.7 + Math.random() * 0.8;
      
      elements.push(
        <group key={`outer-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree />
        </group>
      );
    }
    
    // Add a second ring of trees to enhance forest density
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2 + 0.05;
      const radius = forestRadius * 0.7 + Math.random() * 0.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.7 + Math.random() * 0.8;
      
      elements.push(
        <group key={`mid-tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <Tree />
        </group>
      );
    }
    
    // Scattered inner trees
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * forestRadius * 0.6;
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
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * forestRadius * 0.6;
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
  }, [size, isInfinite]);
  
  // Generate additional ground planes for infinite effect
  const infiniteGroundElements = useMemo(() => {
    if (!isInfinite) return null;
    
    const elements = [];
    const visibleSize = size * 2;
    const tiles = 3; // Reduced for better performance
    
    for (let x = -tiles; x <= tiles; x++) {
      for (let z = -tiles; z <= tiles; z++) {
        // Skip the center tile (it's rendered separately)
        if (x === 0 && z === 0) continue;
        
        elements.push(
          <mesh
            key={`ground-${x}-${z}`}
            position={[x * visibleSize, -0.01, z * visibleSize]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[visibleSize, visibleSize]} />
            <primitive object={grassMaterial} />
          </mesh>
        );
      }
    }
    
    return elements;
  }, [size, isInfinite, grassMaterial]);
  
  return (
    <group>
      {/* Main ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[size * 2, size * 2]} />
        <primitive object={grassMaterial} />
      </mesh>
      
      {/* Infinite ground planes */}
      {infiniteGroundElements}
      
      {/* Subtle grid for gameplay reference - only show when not infinite */}
      {!isInfinite && (
        <gridHelper 
          args={[size * 2, size * 2, '#465c31', '#465c31']} 
          position={[0, 0.01, 0]} 
        />
      )}
      
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
