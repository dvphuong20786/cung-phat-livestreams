import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import { useTempleGameStore } from './useTempleGameStore';
import { Character } from './components/Character';
import {
  BuddhaShrine,
  Courtyard,
  IncenseBurner,
  Lanterns,
  OfferingTable,
  SceneLighting,
  SkyGround,
  TempleBuilding,
  TempleGate,
  Trees,
} from './components/TempleEnvironment';
import { TempleInterior } from './components/TempleInterior';
import { SeatedVisitors } from './components/SeatedVisitors';
import { TempleEffects } from './components/TempleEffects';
export type CameraPreset = 'OVERVIEW' | 'ENTRANCE' | 'SHRINE';
export type TempleTheme = 'COURTYARD' | 'INTERIOR';
export type WorshipDistance = 'NEAR' | 'STANDARD';
function TempleCamera({ preset, theme }: { preset: CameraPreset; theme: TempleTheme }) {
  useFrame(({ camera }, delta) => {
    const outdoor = { OVERVIEW: [13, 11, 18], ENTRANCE: [9, 6, 13], SHRINE: [5, 4, -0.5] },
      interior = { OVERVIEW: [0, 6.7, 25], ENTRANCE: [0, 5.5, 18], SHRINE: [0, 4, 9] };
    const targets = (theme === 'INTERIOR' ? interior : outdoor)[preset];
    camera.position.x += (targets[0] - camera.position.x) * Math.min(1, delta * 2);
    camera.position.y += (targets[1] - camera.position.y) * Math.min(1, delta * 2);
    camera.position.z += (targets[2] - camera.position.z) * Math.min(1, delta * 2);
    if (theme === 'INTERIOR') camera.lookAt(0, preset === 'OVERVIEW' ? 2.2 : 2.4, -5.2);
    else camera.lookAt(0, 1, -2);
  });
  return null;
}
function TempleBell() {
  const bell = useRef<Group>(null);
  const active = useTempleGameStore((s) =>
    s.active.some((c) => c.action.actionType === 'BELL_EFFECT'),
  );
  useFrame((state) => {
    if (bell.current)
      bell.current.rotation.z = active ? Math.sin(state.clock.elapsedTime * 8) * 0.22 : 0;
  });
  return (
    <group ref={bell} position={[4.8, 4.1, -3]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.45, 0.7, 1.1, 18, 1, true]} />
        <meshStandardMaterial color="#bd7e2f" metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.65, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color="#8e541e" />
      </mesh>
    </group>
  );
}
function World({
  preset,
  controls,
  theme,
  mobile,
  worshipDistance,
}: {
  preset: CameraPreset;
  controls: boolean;
  theme: TempleTheme;
  mobile: boolean;
  worshipDistance: WorshipDistance;
}) {
  const active = useTempleGameStore((s) => s.active),
    flowers = useTempleGameStore((s) => s.flowers),
    inside = theme === 'INTERIOR';
  return (
    <>
      <TempleCamera preset={preset} theme={theme} />
      {inside ? (
        <>
          <TempleInterior mobile={mobile} />
          <SeatedVisitors mobile={mobile} />
        </>
      ) : (
        <>
          <SceneLighting />
          <SkyGround />
          <Courtyard />
          <TempleGate />
          <TempleBuilding />
          <Trees />
          <Lanterns />
          <BuddhaShrine />
          <OfferingTable flowers={flowers} />
          <IncenseBurner />
        </>
      )}
      {!inside && <TempleBell />}
      <TempleEffects inside={inside} />
      {active.map((character) => (
        <Character
          key={character.action.actionId}
          character={character}
          inside={inside}
          mobile={mobile}
          worshipDistance={worshipDistance}
        />
      ))}
      {controls && (
        <OrbitControls
          target={[0, 1, -2]}
          enableDamping
          maxPolarAngle={Math.PI * 0.48}
          minDistance={inside ? 5 : 8}
          maxDistance={inside ? 38 : 34}
        />
      )}
    </>
  );
}
export function TempleScene({
  preset = 'OVERVIEW',
  theme = 'COURTYARD',
  controls = false,
  mobile = false,
  worshipDistance = 'NEAR',
  className = 'h-full w-full',
}: {
  preset?: CameraPreset;
  theme?: TempleTheme;
  controls?: boolean;
  mobile?: boolean;
  worshipDistance?: WorshipDistance;
  className?: string;
}) {
  const quality = useTempleGameStore((s) => s.quality);
  const dpr = quality === 'LOW' ? 1 : quality === 'MEDIUM' ? [1, 1.5] : [1, 2];
  return (
    <div className={className}>
      <Canvas
        shadows={quality !== 'LOW'}
        dpr={dpr as [number, number]}
        camera={{ position: [13, 11, 18], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: quality !== 'LOW',
          powerPreference: 'high-performance',
          alpha: mobile,
        }}
      >
        {!mobile && (
          <color attach="background" args={[theme === 'INTERIOR' ? '#27110f' : '#91b8d0']} />
        )}
        <Suspense fallback={null}>
          <World
            preset={preset}
            controls={controls}
            theme={theme}
            mobile={mobile}
            worshipDistance={worshipDistance}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
