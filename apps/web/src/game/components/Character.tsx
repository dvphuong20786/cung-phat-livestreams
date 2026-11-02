import { useMemo, useRef } from 'react';
import { Billboard, Html, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Group, MathUtils, Vector3 } from 'three';
import type { TempleGameAction } from '@live/shared';
import type { ActiveCharacter, CharacterState } from '../useTempleGameStore';
import { useTempleGameStore } from '../useTempleGameStore';
import type { WorshipDistance } from '../TempleScene';
import { getCultivationInfo } from '../cultivationLevel';
import { getMobileSeatPosition, getSeatPosition, isGenericAudienceName } from './SeatedVisitors';
const spawn = new Vector3(0, 0, 14),
  outdoorGate = new Vector3(0, 0, 7.5),
  outdoorCourtyard = new Vector3(0, 0, 1.5),
  outdoorShrine = new Vector3(0, 0, -2.3),
  outdoorFlowers = new Vector3(-3, 0, -1.7),
  interiorGate = new Vector3(0, 0, 8.5),
  interiorAisle = new Vector3(0, 0, 3.4),
  interiorAltarStep = new Vector3(0, 0, 1.4),
  interiorShrine = new Vector3(0, 0, 0.15),
  interiorFlowers = new Vector3(-0.9, 0, 0.25),
  exit = new Vector3(0, 0, 3.5);
const colors = ['#6d5bd0', '#d94c68', '#3b82a0', '#ca7b33', '#418a61', '#a84f9a'];
const prayerPhrases = [
  'Nam mô A Di Đà Phật',
  'Con xin thành tâm lễ Phật',
  'Nguyện gia đình bình an',
  'Nguyện mọi người được an lành',
  'Cầu thân tâm an lạc',
  'Nguyện tiêu trừ phiền não',
  'Cầu cha mẹ mạnh khỏe',
  'Nguyện chúng sinh bình an',
  'Con xin hồi hướng công đức',
  'Nguyện lòng luôn hướng thiện',
  'Cầu vạn sự bình an',
  'Nguyện trí tuệ sáng suốt',
  'Xin giữ tâm thanh tịnh',
  'Nguyện duyên lành tăng trưởng',
  'Cầu tai qua nạn khỏi',
  'Nguyện ngày mới an vui',
  'Xin thành kính tri ân Tam Bảo',
  'Nguyện phước lành đến muôn nơi',
];
const prayerPhraseOffset = Math.floor(Math.random() * prayerPhrases.length);
export function CharacterHeadOverlay({
  name,
  position = [0, 2.65, 0],
  avatarUrl,
  message,
  userId,
  isFemale = false,
}: {
  name: string;
  position?: [number, number, number];
  avatarUrl?: string;
  message?: string;
  userId?: string;
  isFemale?: boolean;
}) {
  const interactions = useTempleGameStore((s) => (userId ? s.userInteractions[userId] || 0 : 0));
  const cultivation = getCultivationInfo(interactions, isFemale);
  const hasComment = Boolean(message && message.trim().length > 0);
  const visibleMessage = message && message.length > 90 ? `${message.slice(0, 90)}…` : message;

  return (
    <Html center position={position} distanceFactor={13} zIndexRange={[12, 0]}>
      <div className="flex flex-col items-center pointer-events-none select-none">
        {hasComment ? (
          /* KHI CÓ COMMENT: ẨN TÊN, HIỆN BONG BÓNG COMMENT KÈM AVATAR VÀ HUY HIỆU LEVEL */
          <div className="relative mb-1 flex items-center gap-1.5 max-w-56 rounded-2xl border border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/95 px-3 py-1.5 text-center text-[11px] font-bold leading-snug text-amber-950 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full border border-amber-400 object-cover shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[9px] text-amber-100">
                🙏
              </div>
            )}
            {cultivation.level > 0 && (
              <span
                className={`shrink-0 rounded bg-gradient-to-r ${cultivation.badgeColor} px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow-sm`}
              >
                {cultivation.level}
              </span>
            )}
            <span className="truncate">{visibleMessage}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-100" />
          </div>
        ) : (
          /* KHI KHÔNG CÓ COMMENT: HIỆN AVATAR, SỐ LEVEL VÀ TÊN */
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-300/40 bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-amber-100 shadow-xl backdrop-blur-md">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-5 w-5 rounded-full border-2 border-amber-400 object-cover shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 bg-amber-900/80 text-[10px] font-bold text-amber-200 shadow-sm">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            {cultivation.level > 0 && (
              <span
                className={`rounded bg-gradient-to-r ${cultivation.badgeColor} px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow-sm`}
              >
                {cultivation.level}
              </span>
            )}
            <span>{name}</span>
          </div>
        )}
      </div>
    </Html>
  );
}

export function DevoteeHalo({ color = '#ffd966' }: { color?: string }) {
  const haloRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group position={[0, 1.95, -0.05]}>
      <mesh ref={haloRef as any}>
        <ringGeometry args={[0.45, 0.65, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.65, 0.72, 32]} />
        <meshBasicMaterial
          color="#ffb834"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function DevoteeSprite({
  action,
  state,
  elapsed,
  showName,
  message,
}: {
  action: TempleGameAction;
  state: CharacterState;
  elapsed: number;
  showName: boolean;
  message?: string;
}) {
  const interactions = useTempleGameStore((s) => s.userInteractions[action.userId] || 0);
  const isFemale = (action.userId.charCodeAt(0) || 0) % 12 !== 0;
  const cultivation = getCultivationInfo(interactions, isFemale);

  const baseTexture = useTexture(cultivation.assetUrl);

  const textures = useMemo(() => {
    // Sprite sheet 4 cột x 3 hàng:
    // Ranh giới thực tế của ảnh (do các hàng không chia đều 1/3):
    // Hàng 0 (đứng): Y pixel 0% - 38% -> Three.js UV V: 0.62 -> 1.00 (repeat.y = 0.38, offset.y = 0.62)
    // Hàng 1 (đi bộ): Y pixel 39% - 72% -> Three.js UV V: 0.28 -> 0.61 (repeat.y = 0.33, offset.y = 0.28)
    // Hàng 2 (quỳ lạy): Y pixel 73% - 100% -> Three.js UV V: 0.00 -> 0.27 (repeat.y = 0.27, offset.y = 0.00)

    // Hàng 2: 4 khung quỳ và cúi lễ (bow)
    const bow = Array.from({ length: 4 }, (_, i) => {
      const t = baseTexture.clone();
      t.repeat.set(0.25, 0.27);
      t.offset.set(i * 0.25, 0);
      return t;
    });

    // Hàng 0: 4 khung đứng và thực hiện nghi lễ (standing)
    const standing = Array.from({ length: 4 }, (_, i) => {
      const t = baseTexture.clone();
      t.repeat.set(0.25, 0.38);
      t.offset.set(i * 0.25, 0.62);
      return t;
    });

    // Hàng 1: 4 khung đi bộ (walk) - khoảng V [0.28, 0.61] không bị lấn chân của Hàng 0
    const walk = Array.from({ length: 4 }, (_, i) => {
      const t = baseTexture.clone();
      t.repeat.set(0.25, 0.33);
      t.offset.set(i * 0.25, 0.28);
      return t;
    });

    return { bow, standing, walk };
  }, [baseTexture]);

  const spriteRef = useRef<Group>(null);

  const isWalkingBack =
    state === 'WALKING_TO_GATE' ||
    state === 'WALKING_TO_ALTAR' ||
    state === 'SPAWNING';
  const isWalkingFront = state === 'EXITING';
  const isWalking = isWalkingBack || isWalkingFront;
  const isBowing = state === 'BOWING';
  const isPraying = state === 'PRAYING' || state === 'WAITING';
  const isOffering = state === 'OFFERING_FLOWERS';

  const stepIndex = Math.floor(elapsed * 5.5) % 4;

  let currentTexture = textures.standing[0];
  let planeWidth = 1.95;
  let planeHeight = 2.45;
  let posY = 1.18;

  if (isWalking) {
    currentTexture = textures.walk[stepIndex];
    planeWidth = 1.95;
    planeHeight = 2.45;
    posY = 1.18;
  } else if (isBowing) {
    // Quỳ lạy cúng Phật 10-20s (chu kỳ ~4.6s mỗi lạy, lạy 3 lạy trang nghiêm)
    const cycleTime = 4.6;
    const bowCycleProgress = (elapsed % cycleTime) / cycleTime;
    let frame = 0;
    if (bowCycleProgress < 0.18) frame = 0;
    else if (bowCycleProgress < 0.38) frame = 1;
    else if (bowCycleProgress < 0.58) frame = 2;
    else if (bowCycleProgress < 0.8) frame = 3;
    else if (bowCycleProgress < 0.92) frame = 2;
    else frame = 0;
    currentTexture = textures.bow[frame];
    planeWidth = 1.95;
    planeHeight = 2.45;
    posY = frame === 3 ? 0.75 : frame >= 1 ? 0.85 : 0.95;
  } else if (isOffering) {
    const offerFrame = elapsed > 1.2 ? 3 : 2;
    currentTexture = textures.standing[offerFrame];
    planeWidth = 1.95;
    planeHeight = 2.45;
    posY = 1.18;
  } else if (isPraying) {
    currentTexture = textures.standing[1];
    planeWidth = 1.95;
    planeHeight = 2.45;
    posY = 1.18;
  }

  useFrame((frameState) => {
    if (!spriteRef.current) return;
    const walkingBob = isWalking ? Math.abs(Math.sin(frameState.clock.elapsedTime * 6)) * 0.08 : 0;
    spriteRef.current.position.y = posY + walkingBob;
  });

  return (
    <group ref={spriteRef}>
      {cultivation.hasHalo && <DevoteeHalo color={cultivation.haloColor} />}
      <Billboard follow position={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <meshBasicMaterial
            map={currentTexture}
            transparent
            alphaTest={0.025}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      {showName && (
        <CharacterHeadOverlay
          name={action.nickname}
          avatarUrl={action.avatarUrl}
          message={message}
          userId={action.userId}
          isFemale={isFemale}
          position={[0, isBowing ? 2.15 : 2.75, 0]}
        />
      )}
    </group>
  );
}

function OfferingBadge({ action, state }: { action: TempleGameAction; state: CharacterState }) {
  const isFlower = action.actionType === 'OFFER_FLOWERS';
  const isGift = action.eventType === 'GIFT' || action.actionType === 'OFFER_INCENSE';
  const isLeaving = state === 'EXITING' || state === 'COMPLETED';
  if ((!isFlower && !isGift) || isLeaving) return null;
  const offeringName = isFlower ? action.giftName || 'Hoa dâng Phật' : action.giftName || 'Lễ vật';
  return (
    <Html center position={[0.9, 1.55, 0.2]} distanceFactor={8} zIndexRange={[11, 0]}>
      <div className="flex min-w-20 flex-col items-center rounded-2xl border border-amber-200/60 bg-amber-950/75 px-2 py-1 text-center text-amber-50 shadow-2xl backdrop-blur-sm">
        <div className="animate-bounce text-6xl leading-none drop-shadow-[0_4px_8px_rgba(255,190,50,.8)]">
          {isFlower ? '💐' : '🎁'}
        </div>
        <div className="mt-1 max-w-28 truncate text-[10px] font-bold">{offeringName}</div>
        {(action.quantity ?? 1) > 1 && (
          <div className="text-xs font-black text-amber-300">×{action.quantity}</div>
        )}
      </div>
    </Html>
  );
}
export function Character({
  character,
  inside = false,
  mobile = false,
  worshipDistance = 'NEAR',
}: {
  character: ActiveCharacter;
  inside?: boolean;
  mobile?: boolean;
  worshipDistance?: WorshipDistance;
}) {
  const root = useRef<Group>(null),
    body = useRef<Group>(null),
    leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null),
    leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null);
  const elapsed = useRef(0),
    targetIndex = useRef(0),
    returnPathIndex = useRef(0),
    offered = useRef(false);
  const { paused, setState, complete, addFlower, seatedVisitors, active } = useTempleGameStore();
  const action = character.action;
  const isFakeCharacter = action.isSimulated === true;
  const shouldHideName = isFakeCharacter && isGenericAudienceName(action.nickname);
  const genericAudienceIndex = active
    .filter((activeCharacter) => activeCharacter.action.isSimulated === true)
    .findIndex((activeCharacter) => activeCharacter.action.actionId === action.actionId);
  const automaticPrayer = isFakeCharacter
    ? prayerPhrases[(Math.max(0, genericAudienceIndex) + prayerPhraseOffset) % prayerPhrases.length]
    : undefined;
  const isJoinOnly = action.eventType === 'JOIN';
  const isLike = action.eventType === 'LIKE';
  const isComment =
    action.eventType === 'COMMENT' ||
    action.actionType === 'SAY_COMMENT' ||
    action.actionType === 'PRAY';
  const ceremony = action.actionType === 'OFFER_FLOWERS' || action.actionType === 'OFFER_INCENSE';
  const isDonation = action.eventType === 'GIFT' || ceremony;

  const likeText =
    action.quantity && action.quantity > 1
      ? `❤️ Thả ${action.quantity} tim cúng Phật`
      : '❤️ Thả tim cúng Phật';
  const displayedMessage =
    action.message || (isLike ? likeText : automaticPrayer);
  const characterHash = Math.abs(
    [...action.userId].reduce((total, character) => total + character.charCodeAt(0), 0),
  );
  const isFemaleCharacter = characterHash % 12 !== 0;
  const activeIndex = Math.max(
    0,
    active.findIndex((activeCharacter) => activeCharacter.action.actionId === action.actionId),
  );
  const approachLanes = [-1.35, -0.45, 0.45, 1.35];
  const approachLane = approachLanes[activeIndex % approachLanes.length];
  const altarRow = Math.floor(activeIndex / approachLanes.length) % 3;
  const color = useMemo(
    () =>
      colors[Math.abs([...action.userId].reduce((n, c) => n + c.charCodeAt(0), 0)) % colors.length],
    [action.userId],
  );

  // Tính trước toạ độ đệm sen ghế ngồi của nhân vật
  const visibleVisitors = mobile ? seatedVisitors.slice(0, 16) : seatedVisitors.slice(0, 24);
  const seatIndex = visibleVisitors.findIndex((visitor) => visitor.userId === action.userId);
  const userHash = Math.abs(
    [...action.userId].reduce((total, c) => total + c.charCodeAt(0), 0),
  );
  const resolvedSeatIndex = seatIndex >= 0 ? seatIndex : userHash % (mobile ? 16 : 24);
  const [seatX, seatY, seatZ] = mobile
    ? getMobileSeatPosition(resolvedSeatIndex)
    : getSeatPosition(resolvedSeatIndex);

  const path = useMemo(() => {
    const gate = inside ? interiorGate : outdoorGate;
    const aisle = inside ? interiorAisle : outdoorCourtyard;

    // 1. Với người JOIN vào kênh không tương tác: đi thẳng vào chỗ ngồi quỳ luôn!
    if (isJoinOnly) {
      return [
        new Vector3(approachLane * 0.35, 0, gate.z),
        new Vector3(seatX * 0.7, 0, Math.max(3.2, seatZ - 0.6)),
        new Vector3(seatX, 0, seatZ),
      ];
    }

    if (inside && mobile) {
      const isNearStatue = worshipDistance === 'NEAR';
      const altarTargetZ = isNearStatue
        ? (isDonation ? 3.45 : 4.2) + altarRow * 0.42
        : (isDonation ? 4.7 : 6) + altarRow * 0.52;
      const altarStepZ = isNearStatue ? 5.8 : isDonation ? 6.25 : 7.35;
      const mobileAltarTarget = new Vector3(approachLane * 0.3, 0, altarTargetZ);
      return [
        new Vector3(approachLane * 0.35, 0, 12),
        new Vector3(approachLane, 0, 9.5),
        new Vector3(approachLane * 0.82, 0, altarStepZ),
        mobileAltarTarget,
      ];
    }
    // Khu vực cắm hương riêng: trước lư hương chính ở cuối thảm đỏ
    const incenseStation = inside ? new Vector3(approachLane * 0.25, 0, 1.35) : outdoorShrine;
    if (inside) {
      return [
        new Vector3(approachLane * 0.35, 0, gate.z),
        new Vector3(approachLane * 0.45, 0, aisle.z),
        new Vector3(approachLane * 0.25, 0, interiorAltarStep.z),
        incenseStation,
      ];
    }
    return [gate, aisle, incenseStation];
  }, [
    action.actionType,
    altarRow,
    approachLane,
    ceremony,
    inside,
    isDonation,
    isJoinOnly,
    mobile,
    seatX,
    seatZ,
    worshipDistance,
  ]);
  const returnPath = useMemo(() => {
    if (!inside) return [exit];
    const side = seatX < 0 ? -1 : 1;
    // Rời khu vực cắm hương, đi dạt sang mép thảm đỏ rồi vào đúng chỗ ngồi ở 2 hàng bên dưới
    return [
      new Vector3(side * 1.5, 0, 2.6),
      new Vector3(side * (Math.abs(seatX) + 0.1), 0, Math.max(2.8, seatZ - 0.6)),
      new Vector3(seatX, 0, seatZ),
    ];
  }, [inside, seatX, seatZ]);
  useFrame((state, delta) => {
    const group = root.current;
    if (!group || paused) return;
    elapsed.current += delta;
    const currentState = character.state;
    const depthProgress = MathUtils.clamp(
      (group.position.z - interiorShrine.z) / (spawn.z - interiorShrine.z),
      0,
      1,
    );
    // Nhân vật chỉ bé đi tầm 90% khi đi vào tới chánh điện (giữ kích thước to rõ, trang nghiêm)
    const depthScale = inside ? 0.9 + depthProgress * 0.1 : 0.95;
    const smoothScale = MathUtils.lerp(group.scale.x, depthScale, Math.min(1, delta * 4.5));
    group.scale.setScalar(smoothScale);
    const isWorshipping =
      currentState === 'PRAYING' ||
      currentState === 'BOWING' ||
      currentState === 'OFFERING_FLOWERS';
    if (body.current) {
      body.current.position.y = MathUtils.lerp(
        body.current.position.y,
        isWorshipping ? 0.48 : 1.05,
        Math.min(1, delta * 5),
      );
      body.current.scale.y = MathUtils.lerp(
        body.current.scale.y,
        isWorshipping ? 0.62 : 1,
        Math.min(1, delta * 5),
      );
    }
    if (currentState === 'SPAWNING') {
      group.position.copy(spawn);
      group.scale.setScalar(1.0);
      targetIndex.current = 0;
      setState(action.actionId, 'WALKING_TO_GATE');
      return;
    }
    if (
      currentState === 'WALKING_TO_GATE' ||
      currentState === 'WALKING_TO_ALTAR' ||
      currentState === 'EXITING'
    ) {
      const target =
        currentState === 'EXITING'
          ? (returnPath[returnPathIndex.current] ?? returnPath[returnPath.length - 1])
          : path[targetIndex.current];
      const direction = target.clone().sub(group.position);
      const distance = direction.length();
      const arrivalThreshold = Math.max(0.25, delta * 3.5);
      if (distance < arrivalThreshold) {
        if (currentState === 'EXITING') {
          returnPathIndex.current++;
          if (returnPathIndex.current >= returnPath.length) {
            group.position.copy(target);
            setState(action.actionId, 'COMPLETED');
            complete(action.actionId);
          }
          return;
        }
        targetIndex.current++;
        if (targetIndex.current < path.length) {
          setState(
            action.actionId,
            targetIndex.current === 1 ? 'WALKING_TO_ALTAR' : 'WALKING_TO_ALTAR',
          );
        } else {
          // 1. Với người JOIN vào kênh không tương tác: đi vào chỗ ngồi quỳ luôn!
          if (isJoinOnly) {
            group.position.copy(target);
            setState(action.actionId, 'COMPLETED');
            complete(action.actionId);
            return;
          }
          elapsed.current = 0;
          if (action.actionType === 'OFFER_FLOWERS') setState(action.actionId, 'OFFERING_FLOWERS');
          else if (isDonation) setState(action.actionId, 'BOWING');
          else setState(action.actionId, 'PRAYING');
        }
        return;
      } else {
        direction.normalize();
        group.position.addScaledVector(direction, delta * 2.25);
        group.rotation.y = MathUtils.lerp(
          group.rotation.y,
          Math.atan2(direction.x, direction.z),
          Math.min(1, delta * 7),
        );
        const swing = Math.sin(state.clock.elapsedTime * 9) * 0.65;
        const isCarryingOffering = ceremony && currentState !== 'EXITING';
        if (leftArm.current) leftArm.current.rotation.x = isCarryingOffering ? -1.12 : swing;
        if (rightArm.current) rightArm.current.rotation.x = isCarryingOffering ? -1.12 : -swing;
        if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.75;
        if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.75;
      }
      return;
    }
    if (isWorshipping) {
      if (leftArm.current) {
        leftArm.current.rotation.x = MathUtils.lerp(leftArm.current.rotation.x, -1.25, delta * 5);
        leftArm.current.rotation.z = 0.18;
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = MathUtils.lerp(rightArm.current.rotation.x, -1.25, delta * 5);
        rightArm.current.rotation.z = -0.18;
      }
      group.rotation.x =
        currentState === 'BOWING'
          ? Math.sin(Math.min(1, elapsed.current / 1.2) * Math.PI) * 0.35
          : Math.sin(state.clock.elapsedTime * 2) * 0.03;
      if (currentState === 'OFFERING_FLOWERS' && !offered.current && elapsed.current > 1.5) {
        offered.current = true;
        addFlower();
      }
      // 2. Tương tác comment, tim: hành lễ tầm 5s
      // 3. Tương tác tặng donate hoa, gift: hành lễ tầm 10s
      const worshipDuration = isDonation ? 10.0 : 5.0;
      if (elapsed.current > worshipDuration) {
        elapsed.current = 0;
        if (currentState === 'OFFERING_FLOWERS') {
          setState(action.actionId, 'BOWING');
        } else {
          returnPathIndex.current = 0;
          setState(action.actionId, 'EXITING');
        }
      }
      return;
    }
    if (currentState === 'WAITING' && elapsed.current > 1.8) {
      elapsed.current = 0;
      returnPathIndex.current = 0;
      setState(action.actionId, 'EXITING');
    }
  });
  const carrying = ceremony && character.state !== 'EXITING';
  return (
    <group ref={root} position={[spawn.x, spawn.y, spawn.z]} scale={1.0}>
      <OfferingBadge action={action} state={character.state} />
      <DevoteeSprite
        action={action}
        state={character.state}
        elapsed={elapsed.current}
        showName={!shouldHideName}
        message={displayedMessage}
      />
    </group>
  );
}
