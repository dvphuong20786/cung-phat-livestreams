import { useEffect, useState } from 'react';
import { Billboard, Box, Html, useTexture } from '@react-three/drei';
import { useTempleGameStore } from '../useTempleGameStore';

const seatColumns = [-10, -7.5, -5, -2.5, 2.5, 5, 7.5, 10];
export function isGenericAudienceName(nickname: string): boolean {
  const normalizedName = nickname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();
  return /^khan gia(?:\s+\d+)?$/.test(normalizedName);
}
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
export function getMobileSeatPosition(index: number): [number, number, number] {
  const mobileColumns = [-4.2, -2.6, 2.6, 4.2];
  const safeIndex = Math.max(0, index) % 24;
  return [
    mobileColumns[safeIndex % mobileColumns.length],
    0,
    7.3 + Math.floor(safeIndex / mobileColumns.length) * 1.45,
  ];
}
const colors = ['#7357b8', '#ba4768', '#357e96', '#bd7335', '#3f805d', '#96518c'];
function MobileSeatedFigure({
  index,
  nickname,
  userId,
  isSimulated,
  avatarUrl,
}: {
  index: number;
  nickname: string;
  userId: string;
  isSimulated: boolean;
  avatarUrl?: string;
}) {
  const maleTexture = useTexture('/assets/worshipper-kneeling-mobile.png');
  const femaleTexture = useTexture('/assets/female-worshipper-kneeling-mobile.png');
  const [x, y, z] = getMobileSeatPosition(index);
  const userHash = Math.abs(
    [...userId].reduce((total, character) => total + character.charCodeAt(0), 0),
  );
  const figureScale = 0.82 + (userHash % 5) * 0.035;
  const flip = userHash % 2 ? -1 : 1;
  const texture = userHash % 12 === 0 ? maleTexture : femaleTexture;
  return (
    <group position={[x, y, z]}>
      <Billboard follow position={[0, 0.62, 0]} scale={[flip * figureScale, figureScale, 1]}>
        <mesh>
          <planeGeometry args={[1.14, 1.7]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.025}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      {!(isSimulated && isGenericAudienceName(nickname)) && (
        <Html center position={[0, 1.35, 0]} distanceFactor={19} zIndexRange={[5, 0]}>
          <div className="flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-100/15 bg-[#24110ed9] px-1.5 py-0.5 text-[8px] text-amber-50/80">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
            )}
            {nickname}
          </div>
        </Html>
      )}
    </group>
  );
}
function SeatedFigure({
  index,
  nickname,
  userId,
  mobile,
  isSimulated,
  avatarUrl,
}: {
  index: number;
  nickname: string;
  userId: string;
  mobile: boolean;
  isSimulated: boolean;
  avatarUrl?: string;
}) {
  if (mobile) {
    return (
      <MobileSeatedFigure
        index={index}
        nickname={nickname}
        userId={userId}
        isSimulated={isSimulated}
        avatarUrl={avatarUrl}
      />
    );
  }
  const [x, y, z] = mobile ? getMobileSeatPosition(index) : getSeatPosition(index),
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
      {!(isSimulated && isGenericAudienceName(nickname)) && (
        <Html center position={[0, 0.98, 0]} distanceFactor={18} zIndexRange={[5, 0]}>
          <div className="flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-100/15 bg-[#24110ed9] px-1.5 py-0.5 text-[9px] text-amber-50/80">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
            )}
            {nickname}
          </div>
        </Html>
      )}
    </group>
  );
}
export function SeatedVisitors({ mobile = false }: { mobile?: boolean }) {
  const seatedVisitors = useTempleGameStore((state) => state.seatedVisitors),
    active = useTempleGameStore((state) => state.active);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => window.clearInterval(intervalId);
  }, []);
  const activeUsers = new Set(active.map((character) => character.action.userId));
  const visitorsStillSeated = seatedVisitors.filter((visitor) => {
    const seatingDuration = visitor.isSimulated ? 90_000 : 15 * 60_000;
    return currentTime - visitor.createdAt <= seatingDuration;
  });
  const visibleVisitors = mobile ? visitorsStillSeated.slice(0, 24) : visitorsStillSeated;
  return (
    <group>
      {visibleVisitors.map((visitor, index) =>
        activeUsers.has(visitor.userId) ? null : (
          <SeatedFigure
            key={visitor.userId}
            index={index}
            nickname={visitor.nickname}
            userId={visitor.userId}
            mobile={mobile}
            isSimulated={visitor.isSimulated === true}
            avatarUrl={visitor.avatarUrl}
          />
        ),
      )}
    </group>
  );
}
