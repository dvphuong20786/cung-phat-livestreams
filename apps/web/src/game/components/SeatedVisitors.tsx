import { Box, Html } from '@react-three/drei';
import { useTempleGameStore } from '../useTempleGameStore';

const seatColumns = [-10, -7.5, -5, -2.5, 2.5, 5, 7.5, 10];
export function getSeatPosition(index: number): [number, number, number] {
  const safeIndex = Math.max(0, index) % 80;
  const rowIndex = Math.floor(safeIndex / seatColumns.length);
  // Hàng gần camera xòe rộng hơn, hàng gần bàn Phật thu vào để khớp phối cảnh ảnh nền.
  const perspectiveScale = 0.72 + rowIndex * 0.045;
  return [
    seatColumns[safeIndex % seatColumns.length] * perspectiveScale,
    0,
    1.5 + rowIndex * 1.45,
  ];
}
const colors = ['#7357b8', '#ba4768', '#357e96', '#bd7335', '#3f805d', '#96518c'];
function SeatedFigure({
  index,
  nickname,
  userId,
  horizontalScale,
}: {
  index: number;
  nickname: string;
  userId: string;
  horizontalScale: number;
}) {
  const [seatX, y, z] = getSeatPosition(index),
    x = seatX * horizontalScale,
    color =
      colors[
        Math.abs([...userId].reduce((total, character) => total + character.charCodeAt(0), 0)) %
          colors.length
      ];
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
      <Box args={[1.25, 0.12, 0.92]} position={[0, 0.08, 0]} receiveShadow>
        <meshStandardMaterial color="#8a2f28" roughness={0.85} />
      </Box>
      <group position={[0, 0.1, 0]} scale={0.48}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.58, 5, 9]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.34, -0.03]} castShadow>
          <sphereGeometry args={[0.27, 14, 10]} />
          <meshStandardMaterial color="#d5a17d" />
        </mesh>
        <mesh position={[-0.24, 0.25, 0.2]} rotation={[1.15, 0, -0.12]}>
          <capsuleGeometry args={[0.1, 0.55, 4, 7]} />
          <meshStandardMaterial color="#d5a17d" />
        </mesh>
        <mesh position={[0.24, 0.25, 0.2]} rotation={[1.15, 0, 0.12]}>
          <capsuleGeometry args={[0.1, 0.55, 4, 7]} />
          <meshStandardMaterial color="#d5a17d" />
        </mesh>
      </group>
      <Html center position={[0, 0.98, 0]} distanceFactor={18} zIndexRange={[5, 0]}>
        <div className="whitespace-nowrap rounded-full border border-amber-100/15 bg-[#24110ed9] px-1.5 py-0.5 text-[9px] text-amber-50/80">
          {nickname}
        </div>
      </Html>
    </group>
  );
}
export function SeatedVisitors({ mobile = false }: { mobile?: boolean }) {
  const seatedVisitors = useTempleGameStore((state) => state.seatedVisitors),
    active = useTempleGameStore((state) => state.active);
  const activeUsers = new Set(active.map((character) => character.action.userId));
  const horizontalScale = mobile ? 0.43 : 1;
  return (
    <group>
      {seatedVisitors.map((visitor, index) =>
        activeUsers.has(visitor.userId) ? null : (
          <SeatedFigure
            key={visitor.userId}
            index={index}
            nickname={visitor.nickname}
            userId={visitor.userId}
            horizontalScale={horizontalScale}
          />
        ),
      )}
    </group>
  );
}
