import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
}

export const Bullet: React.FC<BulletProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Group>(null);
  const startPosition = useRef<[number, number, number]>(position);
  
  // Store initial position when bullet is created
  if (!startPosition.current) {
    startPosition.current = [...position] as [number, number, number];
    console.log("[DEBUG] Bullet created at:", position);
  }
  
  useFrame(() => {
    if (meshRef.current && trailRef.current) {
      // Set bullet position
      meshRef.current.position.set(position[0], position[1], position[2]);
      
      // Rotate bullet for dynamic effect
      meshRef.current.rotation.x += 0.2;
      meshRef.current.rotation.z += 0.1;
      
      // Calculate trail from start position to current position
      const startPos = startPosition.current;
      const currentPos = position;
      
      // Calculate midpoint for trail positioning
      const midX = (startPos[0] + currentPos[0]) / 2;
      const midY = (startPos[1] + currentPos[1]) / 2;
      const midZ = (startPos[2] + currentPos[2]) / 2;
      
      // Calculate distance for trail length
      const dx = currentPos[0] - startPos[0];
      const dy = currentPos[1] - startPos[1];
      const dz = currentPos[2] - startPos[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Position trail at midpoint of trajectory
      trailRef.current.position.set(midX, midY, midZ);
      
      // Calculate rotation to align trail with bullet direction
      if (distance > 0.001) {
        // Point trail along trajectory
        const angleY = Math.atan2(dx, dz);
        const angleX = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
        trailRef.current.rotation.y = angleY;
        trailRef.current.rotation.x = angleX;
      }
      
      // Set trail length based on distance traveled
      trailRef.current.scale.set(0.1, 0.1, distance);
      
      // Log position for debugging
      if (Math.random() < 0.01) { // Only log occasionally to avoid spam
        console.log("[DEBUG] Bullet at:", position, "Trail distance:", distance.toFixed(2));
      }
    }
  });

  return (
    <group>
      {/* Larger, brighter bullet */}
      <mesh ref={meshRef} position={position} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#FF5500" emissive="#FF5500" emissiveIntensity={3} />
      </mesh>
      
      {/* Bullet trail - bright, visible line showing trajectory */}
      <group ref={trailRef}>
        {/* Main beam trail */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#FFAA00" transparent={true} opacity={0.9} />
        </mesh>
        
        {/* Inner beam for glow effect */}
        <mesh>
          <boxGeometry args={[0.5, 0.5, 1]} />
          <meshBasicMaterial color="#FFFFFF" transparent={true} opacity={0.7} />
        </mesh>
        
        {/* Add bright light to illuminate surroundings */}
        <pointLight color="#FF7700" intensity={10} distance={6} decay={1} />
      </group>
      
      {/* Add another light at the bullet position for extra glow */}
      <pointLight color="#FF5500" intensity={5} distance={3} />
    </group>
  );
};
