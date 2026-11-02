import { useMemo, useRef } from 'react';
import { Billboard, Cylinder, Html, Sphere, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Group, MathUtils, Mesh } from 'three';

interface MonkConfig {
  title: string;
  position: [number, number, number];
  isAbbot?: boolean;
}

const monks: MonkConfig[] = [
  { title: 'Thầy Minh Đạo', position: [-2.1, 0, 0.25] },
  { title: 'Sư Trụ Trì', position: [0, 0, 0.15], isAbbot: true },
  { title: 'Thầy Tâm Từ', position: [2.1, 0, 0.25] },
];

function WoodenFish({ isAbbot = false }: { isAbbot?: boolean }) {
  const strikerRef = useRef<Group>(null);

  useFrame((state) => {
    if (strikerRef.current) {
      // Nhịp gõ mõ đều đặn thanh tịnh (khoảng 1.2 giây một tiếng gõ)
      const beat = Math.sin(state.clock.elapsedTime * 3.8);
      strikerRef.current.rotation.x = -0.4 + Math.max(0, beat) * 0.45;
    }
  });

  return (
    <group position={[0, 0.12, 0.48]}>
      {/* Đôn gỗ để mõ */}
      <Cylinder args={[0.22, 0.25, 0.22, 14]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3a1d13" roughness={0.7} />
      </Cylinder>

      {/* Chiếc Mõ Gỗ sơn son thếp vàng */}
      <Sphere
        args={[0.13, 16, 12]}
        scale={[1.15, 0.85, 1.0]}
        position={[0, 0.18, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={isAbbot ? '#963426' : '#7a281c'}
          metalness={0.2}
          roughness={0.4}
        />
      </Sphere>

      {/* Dùi gõ mõ nhịp nhàng */}
      <group ref={strikerRef} position={[0.14, 0.22, 0.08]}>
        <Cylinder args={[0.012, 0.016, 0.28, 8]} rotation={[0.4, 0, -0.3]}>
          <meshStandardMaterial color="#c29663" />
        </Cylinder>
        <Sphere args={[0.026, 8, 8]} position={[-0.05, 0.11, -0.06]}>
          <meshStandardMaterial color="#8a3020" />
        </Sphere>
      </group>
    </group>
  );
}

function AbbotAura() {
  const auraRef = useRef<Mesh>(null);
  const outerRingRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (auraRef.current) {
      auraRef.current.rotation.z += delta * 0.15;
    }
    if (outerRingRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.06;
      outerRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group position={[0, 1.25, -0.08]}>
      {/* Vòng tròn hào quang Phật pháp sáng rực */}
      <mesh ref={auraRef}>
        <ringGeometry args={[0.65, 0.88, 36]} />
        <meshBasicMaterial
          color="#ffd966"
          transparent
          opacity={0.65}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh ref={outerRingRef}>
        <ringGeometry args={[0.88, 0.98, 36]} />
        <meshBasicMaterial
          color="#ffb834"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {/* Nguồn sáng ấm từ hào quang */}
      <pointLight color="#ffe07a" intensity={0.9} distance={3.5} />
    </group>
  );
}

function MonkFigure({ config }: { config: MonkConfig }) {
  const monkTexture = useTexture('/assets/monk-kneeling-yellow.png');
  const cushionTexture = useTexture('/assets/lotus-cushion.svg');
  const figureRef = useRef<Group>(null);

  useFrame((state) => {
    if (figureRef.current) {
      // Nhịp cúi người tụng kinh nhẹ nhàng theo tiếng gõ mõ
      const chantingBob = Math.sin(state.clock.elapsedTime * 3.8) * 0.015;
      figureRef.current.position.y = 0.82 + chantingBob;
      figureRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.9) * 0.02;
    }
  });

  return (
    <group position={config.position}>
      {/* Hào quang rực rỡ riêng cho Sư Trụ Trì */}
      {config.isAbbot && <AbbotAura />}

      {/* Đệm ngồi toà sen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[1.5, 1.2]} />
        <meshBasicMaterial
          map={cushionTexture}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Mô hình Thầy chùa ngồi tụng kinh */}
      <group ref={figureRef}>
        <Billboard follow={false} rotation={[0, 0, 0]}>
          <mesh>
            <planeGeometry args={[1.55, 2.05]} />
            <meshBasicMaterial
              map={monkTexture}
              transparent
              alphaTest={0.025}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      </group>

      {/* Mõ gỗ gõ nhịp nhàng */}
      <WoodenFish isAbbot={config.isAbbot} />

      {/* Nhãn tên vàng trang nghiêm trên đầu kèm Max Level 100 */}
      <Html
        center
        position={[0, config.isAbbot ? 2.5 : 2.3, 0]}
        distanceFactor={14}
        zIndexRange={[11, 0]}
      >
        <div
          className={`flex select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 font-serif text-center shadow-xl backdrop-blur-md ${
            config.isAbbot
              ? 'border-amber-300 bg-gradient-to-r from-[#3e1b0c] via-[#5c2a12] to-[#3e1b0c] text-xs font-black text-amber-200 ring-2 ring-amber-400/40'
              : 'border-amber-400/60 bg-[#28150c]/90 text-[11px] font-bold text-amber-100'
          }`}
        >
          <span className="rounded bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow">
            Lv.100 Trụ trì
          </span>
          <span>{config.title}</span>
        </div>
      </Html>
    </group>
  );
}

export function ChantingMonks() {
  return (
    <group>
      {monks.map((monk) => (
        <MonkFigure key={monk.title} config={monk} />
      ))}
    </group>
  );
}

