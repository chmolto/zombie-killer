import React, { useEffect, useState, useRef } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onShoot: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onShoot }) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Detect if device is mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Don't render controls if not on mobile
  if (!isMobile) return null;
  
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!baseRef.current) return;
    
    setJoystickActive(true);
    
    // Get touch/click position
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Get base element position
    const rect = baseRef.current.getBoundingClientRect();
    const baseX = rect.left + rect.width / 2;
    const baseY = rect.top + rect.height / 2;
    
    setBasePosition({ x: baseX, y: baseY });
    setJoystickPosition({ x: clientX, y: clientY });
  };
  
  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive) return;
    
    // Prevent scrolling on mobile
    e.preventDefault();
    
    // Get touch/click position
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate joystick movement
    const deltaX = clientX - basePosition.x;
    const deltaY = clientY - basePosition.y;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Max radius for joystick movement
    const maxRadius = 50;
    
    // If joystick is moved beyond max radius, normalize position
    if (distance > maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      const normalizedX = Math.cos(angle) * maxRadius + basePosition.x;
      const normalizedY = Math.sin(angle) * maxRadius + basePosition.y;
      setJoystickPosition({ x: normalizedX, y: normalizedY });
    } else {
      setJoystickPosition({ x: clientX, y: clientY });
    }
    
    // Calculate normalized direction values (-1 to 1)
    const normalizedX = Math.min(Math.max(deltaX / maxRadius, -1), 1);
    const normalizedY = Math.min(Math.max(deltaY / maxRadius, -1), 1);
    
    // Call move handler with normalized values
    onMove(normalizedX, -normalizedY); // Invert Y for game coordinates
  };
  
  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPosition({ x: basePosition.x, y: basePosition.y });
    onMove(0, 0); // Stop movement when joystick is released
  };
  
  return (
    <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none z-20">
      {/* Joystick base */}
      <div 
        ref={baseRef}
        className="absolute bottom-16 left-16 w-24 h-24 bg-black/30 rounded-full pointer-events-auto"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={handleJoystickMove}
        onMouseUp={handleJoystickEnd}
        onMouseLeave={handleJoystickEnd}
      >
        {/* Joystick handle */}
        <div 
          ref={joystickRef}
          className="absolute w-12 h-12 bg-gray-400/80 rounded-full border-2 border-white"
          style={{
            left: joystickActive ? `${joystickPosition.x - basePosition.x + 48}px` : '50%',
            top: joystickActive ? `${joystickPosition.y - basePosition.y + 48}px` : '50%',
            transform: 'translate(-50%, -50%)',
            transition: joystickActive ? 'none' : 'all 0.2s ease-out'
          }}
        />
      </div>
      
      {/* Shoot button */}
      <div 
        className="absolute bottom-16 right-16 w-20 h-20 bg-red-500/70 rounded-full flex items-center justify-center pointer-events-auto"
        onTouchStart={onShoot}
        onClick={onShoot}
      >
        <div className="text-white font-bold">SHOOT</div>
      </div>
    </div>
  );
};
