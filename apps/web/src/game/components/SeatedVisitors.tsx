import { useEffect, useMemo, useState } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Texture } from 'three';
import { useTempleGameStore } from '../useTempleGameStore';
import { CharacterHeadOverlay, DevoteeHalo } from './Character';
import { getCultivationInfo } from '../cultivationLevel';
import { calculateSeatingDuration } from '../seatingDuration';

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
  // Mobile: Hàng ngang ngồi 3 người bên trái, 3 người bên phải (6 người/hàng), tổng cộng 4 hàng (Hàng đầu + 3 hàng ở dưới)
  const safeIndex = Math.max(0, index) % 24;
  const rowIndex = Math.floor(safeIndex / 6); // 0, 1, 2, 3
  const colInRow = safeIndex % 6; // 0..2 bên trái, 3..5 bên phải
  const isRightSide = colInRow >= 3;
  const sideIndex = isRightSide ? colInRow - 3 : colInRow; // 0, 1, 2

  // Độ sâu Z của 4 hàng từ gần đến xa: Hàng đầu (6.2), Hàng 1 (7.5), Hàng 2 (8.8), Hàng 3 (10.1)
  const z = 6.2 + rowIndex * 1.3;
  const startX = 1.35 + rowIndex * 0.12;
  const spacing = 1.05 + rowIndex * 0.08;
  const xOffset = startX + sideIndex * spacing;
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
  cushionTexture,
}: {
  index: number;
  nickname: string;
  userId: string;
  mobile: boolean;
  avatarUrl?: string;
  message?: string;
  cushionTexture: Texture;
}) {
  const [x, y, z] = mobile ? getMobileSeatPosition(index) : getSeatPosition(index);
  const userHash = Math.abs(
    [...userId].reduce((total, character) => total + character.charCodeAt(0), 0),
  );
  const flip = userHash % 2 ? -1 : 1;
  const figureScale = (mobile ? 0.95 : 1.05) + (userHash % 5) * 0.025;

  const interactions = useTempleGameStore((s) => s.userInteractions[userId] || 0);
  const isFemale = (userId.charCodeAt(0) || 0) % 12 !== 0;
  const cultivation = getCultivationInfo(interactions, isFemale);

  const baseTexture = useTexture(cultivation.assetUrl);

  const bowTextures = useMemo(() => {
    // Hàng 2 (dưới cùng ảnh, Three.js UV V: 0.00 -> 0.27): 4 khung quỳ và cúi lễ (bow)
    return Array.from({ length: 4 }, (_, i) => {
      const t = baseTexture.clone();
      t.repeat.set(0.25, 0.27);
      t.offset.set(i * 0.25, 0);
      return t;
    });
  }, [baseTexture]);

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
      {/* Vòng hào quang phát sáng nếu đạt cấp bậc Trụ trì / Đại sư (Lv.81-100) */}
      {cultivation.hasHalo && <DevoteeHalo color={cultivation.haloColor} />}

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
        isFemale={isFemale}
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

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => window.clearInterval(intervalId);
  }, []);
  const activeUsers = new Set(active.map((character) => character.action.userId));
  const visitorsStillSeated = seatedVisitors.filter((visitor) => {
    // 11. Ở link overlay/overlay-mobile không hiển thị khách giả lập
    if (hideSimulated && visitor.isSimulated) return false;

    const userInteractionPoints =
      useTempleGameStore.getState().userInteractions[visitor.userId] || 0;
    const seatingDuration = calculateSeatingDuration(visitor, userInteractionPoints);

    const seatStartTime = visitor.seatedAt ?? visitor.createdAt;
    return currentTime - seatStartTime <= seatingDuration;
  });
  const visibleVisitors = visitorsStillSeated.slice(0, 24);
  return (
    <group>
      {visibleVisitors.map((visitor, index) =>
        activeUsers.has(visitor.userId) ? null : (
          <SeatedFigure
            key={visitor.userId}
            index={visitor.seatIndex !== undefined ? visitor.seatIndex : index}
            nickname={visitor.nickname}
            userId={visitor.userId}
            mobile={mobile}
            avatarUrl={visitor.avatarUrl}
            message={visitor.message}
            cushionTexture={cushionTexture}
          />
        ),
      )}
    </group>
  );
}
