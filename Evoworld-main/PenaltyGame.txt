import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface PenaltyGameProps {
  level: number;
  onScore: () => void;
  onMiss: () => void;
  onClose: () => void;
  onReset: () => void;
}

function PowerMeter({ power }) {
  const isGoodTiming = power >= 0.3 && power <= 0.7;
  const isBadTiming = power > 0.8;

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48">
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full relative">
          <div className="absolute inset-y-0 left-[30%] right-[30%] bg-green-500 opacity-50" />
          <div className="absolute inset-y-0 right-0 w-[20%] bg-red-500 opacity-50" />
          <div 
            className={`h-full transition-all duration-100 ${
              isGoodTiming ? 'bg-green-500' : isBadTiming ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${power * 100}%` }}
          />
        </div>
      </div>
      <div className="text-center mt-2 text-white text-sm">
        {isGoodTiming ? 'Perfect Power!' : isBadTiming ? 'Too Much Power!' : 'Keep Holding...'}
      </div>
    </div>
  );
}

function BallTrail({ positions }) {
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.05 * (1 - i / positions.length), 8, 8]} />
          <meshBasicMaterial color="#4a90e2" transparent opacity={0.3 * (1 - i / positions.length)} />
        </mesh>
      ))}
    </group>
  );
}

function Ball({ position, setPosition, isDragging, setIsDragging, power, setPower, onScore, onMiss, onSave }) {
  const ballRef = useRef();
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isShot, setIsShot] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const [trailPositions, setTrailPositions] = useState([]);
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (isDragging && !isShot) {
        const coords = getNormalizedPointerCoords(e);
        setDragCurrent(coords);
      }
    };

    const handleGlobalPointerUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
        setIsShot(true);

        const coords = getNormalizedPointerCoords(e);
        const dx = coords.x - dragStart.x;
        
        let powerModifier = 1;
        if (power >= 0.3 && power <= 0.7) {
          powerModifier = 1.2;
        } else if (power > 0.8) {
          powerModifier = 0.6;
        }
        
        setVelocity({
          x: dx * power * 0.4 * powerModifier,
          y: power * 0.3 * powerModifier,
          z: -power * 0.4 * powerModifier
        });

        const kickAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2052/2052-preview.mp3');
        kickAudio.play().catch(e => console.log('Kick sound failed:', e));
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, isShot, dragStart, power]);

  useFrame((state, delta) => {
    if (!ballRef.current) return;

    if (isDragging) {
      const dragDuration = (Date.now() - dragStartTime) / 1000;
      const holdPowerBonus = Math.min(dragDuration * 0.5, 1);
      setPower(holdPowerBonus);
    }

    if (isShot) {
      position.x += velocity.x * delta * 60;
      position.y += velocity.y * delta * 60;
      position.z += velocity.z * delta * 60;

      velocity.y -= 0.015 * delta * 60;
      velocity.x *= 0.99;
      velocity.z *= 0.99;

      ballRef.current.position.set(position.x, position.y, position.z);

      setTrailPositions(prev => [
        { x: position.x, y: position.y, z: position.z },
        ...prev.slice(0, 8)
      ]);

      if (position.y < 0.2) {
        resetBall();
        onMiss();
        playSound('miss');
      }

      if (position.z < -2.8) {
        if (position.y > 0 && position.y < 2.4 && Math.abs(position.x) < 1.8) {
          onSave(position.x < 0 ? 'left' : position.x > 0 ? 'right' : 'middle');
          resetBall();
        } else {
          resetBall();
          onMiss();
          playSound('miss');
        }
      }
    }
  });

  const resetBall = () => {
    setIsShot(false);
    setPosition({ x: 0, y: 0.2, z: 3 });
    setVelocity({ x: 0, y: 0, z: 0 });
    setTrailPositions([]);
    setPower(0);
  };

  const playSound = (type) => {
    const audio = new Audio();
    audio.src = type === 'goal' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
      : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const handlePointerDown = (e) => {
    if (!isShot) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStartTime(Date.now());
      
      const coords = getNormalizedPointerCoords(e);
      setDragStart(coords);
      setDragCurrent(coords);
    }
  };

  const getNormalizedPointerCoords = (e) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };
  };

  return (
    <>
      <BallTrail positions={trailPositions} />
      <mesh
        ref={ballRef}
        position={[position.x, position.y, position.z]}
        onPointerDown={handlePointerDown}
      >
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.3}
          map={new THREE.TextureLoader().load('https://i.imgur.com/TkxKyVf.png')}
        />
      </mesh>
      {isDragging && (
        <line>
          <bufferGeometry>
            <float32BufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                position.x, position.y, position.z,
                position.x + (dragStart.x - dragCurrent.x) * 2,
                position.y + (dragStart.y - dragCurrent.y) * 2,
                position.z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </line>
      )}
    </>
  );
}

function Goal() {
  return (
    <group position={[0, 1.2, -3]}>
      <mesh position={[-1.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4]} />
        <meshStandardMaterial color="white" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4]} />
        <meshStandardMaterial color="white" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.6, 2.4]} />
        <meshStandardMaterial color="transparent" opacity={0} />
      </mesh>
    </group>
  );
}

function Goalkeeper({ ballPosition }) {
  const goalkeeperRef = useRef();
  const [position, setPosition] = useState('middle');

  useEffect(() => {
    const moveKeeper = () => {
      const random = Math.random();
      if (random < 0.33) {
        setPosition('left');
      } else if (random < 0.66) {
        setPosition('middle');
      } else {
        setPosition('right');
      }
    };
    moveKeeper();
  }, [ballPosition]);

  return (
    <mesh ref={goalkeeperRef} position={getPositionCoords(position)}>
      <sphereGeometry args={[0.25, 8, 8]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

function getPositionCoords(position) {
  switch (position) {
    case 'left':
      return [-1.5, 1, -2.8];
    case 'middle':
      return [0, 1, -2.8];
    case 'right':
      return [1.5, 1, -2.8];
    default:
      return [0, 1, -2.8];
  }
}

const PenaltyGameContainer = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [retriesLeft, setRetriesLeft] = useState(3);
  const [gems, setGems] = useState(0);
  const [coins, setCoins] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);

  const onScore = () => {
    setScore((prevScore) => prevScore + 1);
    setGems((prevGems) => prevGems + 1);
    setCoins((prevCoins) => prevCoins + 10);
  };

  const onMiss = () => {
    if (retriesLeft > 1) {
      setRetriesLeft((prevRetries) => prevRetries - 1);
    } else {
      setIsGameOver(true);
    }
  };

  const onSave = (direction) => {
    console.log(`Goalkeeper saved to the ${direction}`);
  };

  const onReset = () => {
    setScore(0);
    setRetriesLeft(3);
    setIsGameOver(false);
  };

  return (
    <>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <PowerMeter power={0.7} />
        <Ball position={{ x: 0, y: 0.2, z: 3 }} setPosition={() => {}} />
        <Goal />
        <Goalkeeper ballPosition={{ x: 0, y: 0.2, z: 3 }} />
        <OrbitControls />
      </Canvas>
      <div className="absolute top-5 left-5">
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={onReset}>
          Restart Game
        </button>
        <div>Level: {level}</div>
        <div>Score: {score}</div>
        <div>Retries: {retriesLeft}</div>
        <div>Gems: {gems}</div>
        <div>Coins: {coins}</div>
      </div>
      {isGameOver && <div>Game Over</div>}
    </>
  );
};

export default PenaltyGameContainer;
