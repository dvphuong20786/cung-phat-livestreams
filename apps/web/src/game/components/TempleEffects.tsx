import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type PointLight, type Points, type PointsMaterial } from 'three';
import { useTempleGameStore } from '../useTempleGameStore';

function createLightPositions(count: number, inside: boolean): Float32Array {
  const positions = new Float32Array(count * 3);
  let seed = inside ? 1729 : 7919;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < count; index++) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * (inside ? 17 : 14);
    positions[offset + 1] = 0.6 + random() * (inside ? 6.2 : 5.2);
    positions[offset + 2] = (random() - 0.5) * (inside ? 16 : 14) - 1;
  }
  return positions;
}

export function TempleEffects({ inside = false }: { inside?: boolean }) {
  const quality = useTempleGameStore((state) => state.quality);
  const particleCount = quality === 'LOW' ? 18 : quality === 'MEDIUM' ? 36 : 64;
  const positions = useMemo(
    () => createLightPositions(particleCount, inside),
    [inside, particleCount],
  );
  const slowLayer = useRef<Points>(null);
  const fastLayer = useRef<Points>(null);
  const slowMaterial = useRef<PointsMaterial>(null);
  const fastMaterial = useRef<PointsMaterial>(null);
  const altarLight = useRef<PointLight>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    if (slowLayer.current) {
      slowLayer.current.rotation.y += delta * 0.025;
      slowLayer.current.position.y = Math.sin(elapsed * 0.42) * 0.18;
    }
    if (fastLayer.current) {
      fastLayer.current.rotation.y -= delta * 0.04;
      fastLayer.current.position.y = Math.cos(elapsed * 0.55) * 0.12;
    }
    if (slowMaterial.current)
      slowMaterial.current.opacity = 0.5 + Math.sin(elapsed * 1.15) * 0.16;
    if (fastMaterial.current)
      fastMaterial.current.opacity = 0.24 + Math.cos(elapsed * 1.6) * 0.1;
    if (altarLight.current)
      altarLight.current.intensity = 1.4 + Math.sin(elapsed * 1.3) * 0.35;
  });

  return (
    <group>
      <points ref={slowLayer}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={slowMaterial}
          color="#ffd77a"
          size={inside ? 0.13 : 0.1}
          transparent
          opacity={0.58}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={fastLayer} position={[0, 0.25, inside ? -1.5 : 0]} scale={0.82}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={fastMaterial}
          color="#fff1bd"
          size={inside ? 0.075 : 0.065}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      {inside && quality !== 'LOW' && (
        <pointLight
          ref={altarLight}
          position={[0, 4.4, -4.5]}
          color="#ffd27a"
          intensity={1.4}
          distance={11}
          decay={2}
        />
      )}
    </group>
  );
}
