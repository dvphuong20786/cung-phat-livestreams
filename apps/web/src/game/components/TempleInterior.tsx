import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, useTexture } from '@react-three/drei';
import { SRGBColorSpace, type Group } from 'three';

const darkWood = '#4a1814',
  redWood = '#7a201c',
  gold = '#e8b94c';
function Lotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 10;
        return (
          <Sphere
            key={index}
            args={[0.18, 12, 8]}
            scale={[1, 0.35, 1.8]}
            rotation={[0, -angle, 0.45]}
            position={[Math.sin(angle) * 0.2, 0.1, Math.cos(angle) * 0.2]}
          >
            <meshStandardMaterial
              color={index % 2 ? '#ff9fc5' : '#f36f9d'}
              emissive="#8f1e4a"
              emissiveIntensity={0.2}
            />
          </Sphere>
        );
      })}
      <Sphere args={[0.16, 12, 8]} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#ffd36a" emissive="#ff9f30" emissiveIntensity={0.5} />
      </Sphere>
    </group>
  );
}
function Candle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder args={[0.07, 0.08, 0.75, 12]} position={[0, 0.38, 0]}>
        <meshStandardMaterial color="#f5dfb0" />
      </Cylinder>
      <Sphere args={[0.075, 10, 8]} scale={[0.7, 1.5, 0.7]} position={[0, 0.83, 0]}>
        <meshBasicMaterial color="#ffd05a" />
      </Sphere>
      <pointLight position={[0, 0.9, 0]} color="#ff9f45" intensity={0.55} distance={3} />
    </group>
  );
}
function IncenseSmoke() {
  const smoke = useRef<Group>(null);
  useFrame((state) => {
    if (smoke.current) {
      smoke.current.position.y = 1.5 + ((state.clock.elapsedTime * 0.18) % 1.1);
      smoke.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <group ref={smoke} position={[0, 1.5, 0]}>
      {Array.from({ length: 9 }, (_, index) => (
        <Sphere
          key={index}
          args={[0.12 + index * 0.018, 10, 8]}
          scale={[1.7, 0.38, 1]}
          position={[Math.sin(index * 0.9) * 0.18, index * 0.23, 0]}
        >
          <meshBasicMaterial
            color="#dce7e8"
            transparent
            opacity={0.22 - index * 0.014}
            depthWrite={false}
          />
        </Sphere>
      ))}
    </group>
  );
}
function SanctuaryBackdrop({ mobile = false }: { mobile?: boolean }) {
  const texture = useTexture(
    mobile
      ? '/assets/temple-interior-mobile-backdrop.png'
      : '/assets/temple-interior-full-backdrop.png',
  );
  const scene = useThree((state) => state.scene);
  texture.colorSpace = SRGBColorSpace;
  useEffect(() => {
    if (mobile) return;
    const previousBackground = scene.background;
    scene.background = texture;
    return () => {
      scene.background = previousBackground;
    };
  }, [mobile, scene, texture]);
  return null;
}
export function InteriorSanctuary({ flowers }: { flowers: number }) {
  return (
    <group>
      <SanctuaryBackdrop />
      <group visible={false} position={[0, 0, -7]}>
        <Torus args={[2.05, 0.12, 16, 48]} position={[0, 4.2, -0.35]}>
          <meshStandardMaterial
            color="#efbd4c"
            emissive="#c47b19"
            emissiveIntensity={0.7}
            metalness={0.4}
          />
        </Torus>
        <pointLight position={[0, 4.2, 1]} color="#ffcb69" intensity={7} distance={13} />
        <Cylinder args={[1.5, 1.85, 0.6, 32]} position={[0, 0.55, 0]} castShadow>
          <meshStandardMaterial color="#8f3a23" />
        </Cylinder>
        <Cylinder args={[1.15, 1.45, 0.45, 32]} position={[0, 1, 0]} castShadow>
          <meshStandardMaterial color={gold} metalness={0.28} />
        </Cylinder>
        <Sphere args={[1.15, 28, 20]} scale={[1.35, 0.52, 1]} position={[0, 1.55, 0]} castShadow>
          <meshStandardMaterial color="#dca941" metalness={0.25} />
        </Sphere>
        <Cylinder args={[0.68, 0.92, 1.65, 24]} position={[0, 2.45, 0]} castShadow>
          <meshStandardMaterial color="#e0ad45" metalness={0.22} />
        </Cylinder>
        <Sphere args={[0.58, 24, 16]} position={[0, 3.55, 0]} castShadow>
          <meshStandardMaterial color="#e8bd62" metalness={0.18} />
        </Sphere>
        <Sphere args={[0.2, 16, 12]} position={[0, 4.18, 0]}>
          <meshStandardMaterial color="#d99b2e" />
        </Sphere>
      </group>
      <group position={[0, 0, -3.9]}>
        <Box args={[6.8, 0.35, 2.1]} position={[0, 0.85, 0]} castShadow>
          <meshStandardMaterial color="#552018" />
        </Box>
        <Box args={[6.2, 0.15, 1.8]} position={[0, 1.08, 0]}>
          <meshStandardMaterial color="#b6432d" />
        </Box>
        {[-2.6, 2.6].map((x) => (
          <Box key={x} args={[0.24, 1.7, 0.24]} position={[x, 0, 0]}>
            <meshStandardMaterial color={darkWood} />
          </Box>
        ))}
        <Cylinder args={[0.42, 0.35, 0.55, 20]} position={[0, 1.42, 0]}>
          <meshStandardMaterial color="#80502d" metalness={0.35} />
        </Cylinder>
        {[-0.18, 0, 0.18].map((x) => (
          <Cylinder key={x} args={[0.018, 0.018, 0.85, 6]} position={[x, 2.05, 0]}>
            <meshStandardMaterial color="#9c3226" />
          </Cylinder>
        ))}
        <IncenseSmoke />
        {[-2.3, -1.65, 1.65, 2.3].map((x, index) => (
          <Candle key={x} position={[x, 1.12, index % 2 ? 0.35 : -0.35]} />
        ))}
        {[-2.5, 2.5].map((x) => (
          <group key={x} position={[x, 1.28, 0]}>
            {Array.from({ length: Math.max(4, Math.min(10, flowers + 4)) }, (_, index) => (
              <Lotus
                key={index}
                position={[
                  ((index % 3) - 0.9) * 0.38,
                  Math.floor(index / 3) * 0.24,
                  ((index % 2) - 0.5) * 0.28,
                ]}
                scale={0.62}
              />
            ))}
          </group>
        ))}
        <group position={[-0.85, 1.28, 0]}>
          {['#ef8a2f', '#f2bd3d', '#9a3141', '#d9692b'].map((color, index) => (
            <Sphere
              key={color}
              args={[0.18, 12, 8]}
              position={[(index % 2) * 0.28, Math.floor(index / 2) * 0.25, 0]}
            >
              <meshStandardMaterial color={color} />
            </Sphere>
          ))}
        </group>
        <group position={[0.85, 1.28, 0]}>
          {['#e9b02f', '#8f304c', '#d9792f', '#a12f42'].map((color, index) => (
            <Sphere
              key={color}
              args={[0.18, 12, 8]}
              position={[(index % 2) * 0.28, Math.floor(index / 2) * 0.25, 0]}
            >
              <meshStandardMaterial color={color} />
            </Sphere>
          ))}
        </group>
      </group>
    </group>
  );
}
export function TempleInterior({ mobile = false }: { mobile?: boolean }) {
  return (
    <group>
      <SanctuaryBackdrop mobile={mobile} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.02, 3]}>
        <planeGeometry args={[28, 34]} />
        <shadowMaterial transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <hemisphereLight args={['#ffdba1', '#2c1512', 0.8]} />
      <directionalLight
        position={[1, 9, 8]}
        color="#ffd69a"
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 6, -6]} color="#ffc15a" intensity={5} distance={18} />
    </group>
  );
}
