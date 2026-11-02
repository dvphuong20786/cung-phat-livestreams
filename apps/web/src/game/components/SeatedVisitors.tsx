import { useEffect, useMemo, useState } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Texture } from 'three';
import { useTempleGameStore } from '../useTempleGameStore';
import { CharacterHeadOverlay } from './Character';

export function isGenericAudienceName(nickname: string): boolean {
  const normalizedName = nickname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();
  return /^khan gia(?:\s+\d+)?$/.test(normalizedName);
}

// Đúng 2 hàng quỳ bên dưới (Row 0: z ≈ 4.8, Row 1: z ≈ 7.2), chia 2 bên thảm đỏ
export function getSeatPosition(index: number): [number, number, number] {
  const safeIndex = Math.max(0, index) % 24;
  const isRow1 = safeIndex >= 12;
  const colInRow = safeIndex % 12; // 0..5 bên trái, 6..11 bên phải

  const isRightSide = colInRow >= 6;
  const sideIndex = isRightSide ? colInRow - 6 : colInRow;

  const z = isRow1 ? 7.2 : 4.8;
  const baseSpacing = isRow1 ? 1.6 : 1.4;
  const startX = isRow1 ? 2.2 : 1.8;
  const xOffset = startX + sideIndex * baseSpacing;
  const x = isRightSide ? xOffset : -xOffset;

  return [x, 0, z];
}

export function getMobileSeatPosition(index: number): [number, number, number] {
  const safeIndex = Math.max(0, index) % 16;
  const isRow1 = safeIndex >= 8;
  const colInRow = safeIndex % 8;
  const isRightSide = colInRow >= 4;
  const sideIndex = isRightSide ? colInRow - 4 : colInRow;

  const z = isRow1 ? 8.8 : 6.8;
  const baseSpacing = isRow1 ? 1.3 : 1.1;
  const startX = isRow1 ? 1.6 : 1.3;
  const xOffset = startX + sideIndex * baseSpacing;
  const x = isRightSide ? xOffset : -xOffset;

  return [x, 0, z];
}

function SeatedFigure({
  index,
  nickname,
  userId,
  mobile,
  avatarUrl,
  message,
  bowTextures,
  cushionTexture,
}: {
  index: number;
  nickname: string;
  userId: string;
  mobile: boolean;
  avatarUrl?: string;
  message?: string;
  bowTextures: Texture[];
  cushionTexture: Texture;
}) {
  const [x, y, z] = mobile ? getMobileSeatPosition(index) : getSeatPosition(index);
  const userHash = Math.abs(
    [...userId].reduce((total, character) => total + character.charCodeAt(0), 0),
  );
  const flip = userHash % 2 ? -1 : 1;
  const figureScale = (mobile ? 0.95 : 1.05) + (userHash % 5) * 0.025;

  const [bowFrame, setBowFrame] = useState(0);

  useFrame((state) => {
    // Ngồi quỳ xem, niệm Phật (chắp tay tĩnh tại frame 0, thỉnh thoảng cúi đầu nhẹ frame 1)
    const bowCycle = 9.0;
    const userOffset = (userHash % 100) * 0.09;
    const phase = (state.clock.elapsedTime + userOffset) % bowCycle;
    let frame = 0;
    if (phase < 0.6) frame = 0;
    else if (phase < 1.4) frame = 1;
    else frame = 0;
    if (frame !== bowFrame) {
      setBowFrame(frame);
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Đệm toà sen thêu vàng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[1.4, 1.1]} />
        <meshBasicMaterial
          map={cushionTexture}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Phật tử ngồi niệm Phật */}
      <Billboard follow position={[0, 0.78, 0]} scale={[flip * figureScale, figureScale, 1]}>
        <mesh>
          <planeGeometry args={[1.45, 1.95]} />
          <meshBasicMaterial
            map={bowTextures[bowFrame]}
            transparent
            alphaTest={0.025}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      {/* Avatar TikTok trên đầu & Tên/Comment/Level */}
      <CharacterHeadOverlay
        name={nickname}
        avatarUrl={avatarUrl}
        message={message}
        userId={userId}
        isFemale={true}
        position={[0, 1.95, 0]}
      />
    </group>
  );
}

export function SeatedVisitors({
  mobile = false,
  hideSimulated = false,
}: {
  mobile?: boolean;
  hideSimulated?: boolean;
}) {
  const seatedVisitors = useTempleGameStore((state) => state.seatedVisitors),
    active = useTempleGameStore((state) => state.active);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const cushionTexture = useTexture('/assets/lotus-cushion.svg');
  const bowBase = useTexture('/assets/female-bow.png');

  const bowTextures = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const t = bowBase.clone();
      t.repeat.set(0.25, 1);
      t.offset.set(i * 0.25, 0);
      return t;
    });
  }, [bowBase]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => window.clearInterval(intervalId);
  }, []);
  const activeUsers = new Set(active.map((character) => character.action.userId));
  const visitorsStillSeated = seatedVisitors.filter((visitor) => {
    // 11. Ở link overlay/overlay-mobile không hiển thị khách giả lập
    if (hideSimulated && visitor.isSimulated) return false;

    // 7. Khách ngồi quỳ quan sát trong vòng 2 phút (120_000 ms)
    // 8. Khách tới donate, tương tác xong khi xuống ngồi thì 4 phút (240_000 ms) rồi mất
    const isObserver = visitor.eventType === 'JOIN' || visitor.actionType === 'WELCOME';
    const seatingDuration = isObserver ? 2 * 60_000 : 4 * 60_000;
    const seatStartTime = visitor.seatedAt ?? visitor.createdAt;
    return currentTime - seatStartTime <= seatingDuration;
  });
  const visibleVisitors = mobile
    ? visitorsStillSeated.slice(0, 16)
    : visitorsStillSeated.slice(0, 24);
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
            avatarUrl={visitor.avatarUrl}
            message={visitor.message}
            bowTextures={bowTextures}
            cushionTexture={cushionTexture}
          />
        ),
      )}
    </group>
  );
}
