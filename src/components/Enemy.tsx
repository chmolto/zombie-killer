import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnemyProps {
  position: [number, number, number];
  isDying?: boolean;
}

export const Enemy: React.FC<EnemyProps> = ({ position, isDying = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialPosition = useRef(position).current;
  const [prevPosition, setPrevPosition] = useState<[number, number, number]>(position);
  
  // More detailed references for animations
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  // Death animation state
  const [deathAnimation, setDeathAnimation] = useState(false);
  const deathStartTime = useRef(0);
  const deathRotation = useRef(0);
  const deathScale = useRef(1);
  
  useEffect(() => {
    setPrevPosition(position);
  }, [position]);
  
  // Start death animation when isDying changes to true
  useEffect(() => {
    if (isDying && !deathAnimation) {
      setDeathAnimation(true);
      deathStartTime.current = Date.now();
    }
  }, [isDying]);
  
  // Animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    // Death animation takes precedence
    if (deathAnimation) {
      const elapsedTime = (Date.now() - deathStartTime.current) / 1000; // in seconds
      const deathDuration = 1.5; // total seconds for death animation
      
      if (elapsedTime < deathDuration) {
        // Zombie falls and dissolves
        deathRotation.current = Math.min(Math.PI/2, elapsedTime * 2);
        deathScale.current = Math.max(0, 1 - (elapsedTime / deathDuration));
        
        // Apply death animation - fall forward
        groupRef.current.rotation.x = deathRotation.current;
        groupRef.current.scale.set(deathScale.current, deathScale.current, deathScale.current);
        
        // Add vertical motion during death
        groupRef.current.position.y = Math.max(0, position[1] - elapsedTime * 0.5);
        
        // Green particle effect for zombie death
        if (groupRef.current.children.length > 0) {
          // Change material color to create dissolve effect
          groupRef.current.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial;
              if (material) {
                // Fade to transparent
                material.opacity = deathScale.current;
                material.transparent = true;
                
                // Add emission for glow effect
                material.emissive = new THREE.Color('#77D56B');
                material.emissiveIntensity = (1 - deathScale.current) * 3;
              }
            }
          });
        }
        
        // Add more dramatic arm movements during death
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = Math.min(Math.PI/2, elapsedTime * 3);
          rightArmRef.current.rotation.x = Math.min(Math.PI/2, elapsedTime * 3);
        }
        
        // Add leg collapse
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = -Math.min(Math.PI/4, elapsedTime);
          rightLegRef.current.rotation.x = -Math.min(Math.PI/4, elapsedTime);
        }
      }
      
      return; // Skip normal animation if dying
    }
    
    // Normal animation when not dying
    groupRef.current.position.set(...position);
    
    // Calculate movement direction for rotation
    const dx = position[0] - prevPosition[0];
    const dz = position[2] - prevPosition[2];
    const isMoving = Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001;
    
    // Face movement direction
    if (isMoving) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
    
    // Update previous position for next frame
    setPrevPosition(position);
    
    // Basic zombie animation
    const time = clock.getElapsedTime();
    
    // Zombie stagger side to side - more pronounced
    groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.15;
    
    // Head twitching for creepy effect
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(time * 5) * 0.05;
      headRef.current.rotation.y = Math.sin(time * 3) * 0.1;
    }
    
    // Bob up and down with zombie shuffle
    groupRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.1;
    
    // Animate limbs for more realistic movement
    const walkCycle = time * 3; // Slower than player for shuffling effect
    
    // Animate legs with a limping motion (asymmetric)
    if (leftLegRef.current && rightLegRef.current) {
      // Right leg moves more than left for limping effect
      rightLegRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
      leftLegRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
    }
    
    // Animate arms with a reaching motion
    if (leftArmRef.current && rightArmRef.current) {
      // Keep zombie arms outstretched but add slight swaying
      leftArmRef.current.rotation.x = 0.7 + Math.sin(walkCycle) * 0.2;
      rightArmRef.current.rotation.x = 0.7 + Math.sin(walkCycle + Math.PI) * 0.2;
      
      // Add slight inward/outward motion
      leftArmRef.current.rotation.z = Math.PI / 3 + Math.sin(walkCycle) * 0.15;
      rightArmRef.current.rotation.z = -Math.PI / 3 + Math.sin(walkCycle + Math.PI) * 0.15;
      
      // Add slight grabbing motion with arm rotation
      leftArmRef.current.rotation.y = Math.sin(walkCycle * 1.5) * 0.1;
      rightArmRef.current.rotation.y = Math.sin(walkCycle * 1.5 + Math.PI) * 0.1;
    }
    
    // Body twisting for more natural movement
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(walkCycle * 0.5) * 0.05;
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
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 1, 16]} />
        <meshStandardMaterial color="#97F58B" roughness={0.8} />
      </mesh>
      
      {/* Zombie Head */}
      <mesh ref={headRef} position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#77D56B" roughness={0.8} />
      </mesh>
      
      {/* Jaw/teeth */}
      <mesh position={[0, 0.62, 0.2]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.1]} />
        <meshStandardMaterial color="#DDDDDD" roughness={0.6} />
      </mesh>
      
      {/* Arms - outstretched zombie style */}
      <mesh ref={rightArmRef} position={[0.4, 0.2, 0.2]} rotation={[0.7, 0, -Math.PI / 3]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#77D56B" roughness={0.8} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.4, 0.2, 0.2]} rotation={[0.7, 0, Math.PI / 3]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#77D56B" roughness={0.8} />
      </mesh>
      
      {/* Legs */}
      <mesh ref={rightLegRef} position={[0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#579C4D" roughness={0.8} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.5, 1, 12]} />
        <meshStandardMaterial color="#579C4D" roughness={0.8} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-0.08, 0.7, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.7} />
      </mesh>
      
      {/* Death effect particles - only shown during death animation */}
      {deathAnimation && (
        <group>
          {/* Glowing light effect */}
          <pointLight color="#77D56B" intensity={5 * (1 - deathScale.current)} distance={3} />
          
          {/* Green "mist" effect */}
          <mesh position={[0, 0.5, 0]} scale={[1 + (1 - deathScale.current) * 2, 1 + (1 - deathScale.current) * 2, 1 + (1 - deathScale.current) * 2]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#77D56B" transparent opacity={0.3 * (1 - deathScale.current)} />
          </mesh>
        </group>
      )}
    </group>
  );
};
