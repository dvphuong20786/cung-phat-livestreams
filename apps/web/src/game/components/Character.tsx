import { useMemo, useRef } from 'react';
import { Billboard, Html, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Vector3 } from 'three';
import type { TempleGameAction } from '@live/shared';
import type { ActiveCharacter, CharacterState } from '../useTempleGameStore';
import { useTempleGameStore } from '../useTempleGameStore';
import type { WorshipDistance } from '../TempleScene';
import {
  getMobileSeatPosition,
  getSeatPosition,
  isGenericAudienceName,
} from './SeatedVisitors';
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
export function CharacterNameLabel({
  name,
  position = [0, 2.65, 0],
  avatarUrl,
}: {
  name: string;
  position?: [number, number, number];
  avatarUrl?: string;
}) {
  return (
    <Html center position={position} distanceFactor={13} zIndexRange={[10, 0]}>
      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="h-5 w-5 rounded-full border border-white/30 object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        {name}
      </div>
    </Html>
  );
}

function CharacterCommentBubble({ message, mobile }: { message: string; mobile: boolean }) {
  const visibleMessage = message.length > 100 ? `${message.slice(0, 100)}…` : message;
  return (
    <Html
      center
      position={[0, mobile ? 3.45 : 3.15, 0]}
      distanceFactor={mobile ? 11 : 13}
      zIndexRange={[12, 0]}
    >
      <div
        className="max-w-48 rounded-2xl border border-white/35 bg-white/95 px-3 py-2 text-center text-[11px] font-semibold leading-snug text-slate-900 shadow-xl"
        title={message}
      >
        {visibleMessage}
      </div>
    </Html>
  );
}

function MobileWorshipper({
  name,
  state,
  showName,
  avatarUrl,
  female,
}: {
  name: string;
  state: CharacterState;
  showName: boolean;
  avatarUrl?: string;
  female: boolean;
}) {
  const maleWalkingTexture = useTexture('/assets/worshipper-walking-mobile.png');
  const maleKneelingTexture = useTexture('/assets/worshipper-kneeling-mobile.png');
  const femaleWalkingTexture = useTexture('/assets/female-worshipper-walking-mobile.png');
  const femaleKneelingTexture = useTexture('/assets/female-worshipper-kneeling-mobile.png');
  const sprite = useRef<Group>(null);
  const isKneeling =
    state === 'PRAYING' || state === 'BOWING' || state === 'OFFERING_FLOWERS';
  const walkingTexture = female ? femaleWalkingTexture : maleWalkingTexture;
  const kneelingTexture = female ? femaleKneelingTexture : maleKneelingTexture;

  useFrame((frameState) => {
    if (!sprite.current) return;
    const walkingBob = isKneeling ? 0 : Math.abs(Math.sin(frameState.clock.elapsedTime * 6)) * 0.08;
    sprite.current.position.y = walkingBob;
    sprite.current.rotation.z = isKneeling ? 0 : Math.sin(frameState.clock.elapsedTime * 4) * 0.018;
  });

  return (
    <group ref={sprite}>
      <Billboard follow position={[0, isKneeling ? 0.75 : 1.3, 0]}>
        <mesh>
          <planeGeometry args={[isKneeling ? 1.86 : 1.74, isKneeling ? 2.76 : 3.24]} />
          <meshBasicMaterial
            map={isKneeling ? kneelingTexture : walkingTexture}
            transparent
            alphaTest={0.025}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      {showName && (
        <CharacterNameLabel
          name={name}
          avatarUrl={avatarUrl}
          position={[0, isKneeling ? 2.2 : 3.15, 0]}
        />
      )}
    </group>
  );
}

function MobileOfferingBadge({
  action,
  state,
}: {
  action: TempleGameAction;
  state: CharacterState;
}) {
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
  const displayedMessage = action.message || automaticPrayer;
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
  const ceremony = action.actionType === 'OFFER_FLOWERS' || action.actionType === 'OFFER_INCENSE';
  const isGiftOffering = action.eventType === 'GIFT' || ceremony;
  const path = useMemo(() => {
    if (inside && mobile) {
      const isNearStatue = worshipDistance === 'NEAR';
      const altarTargetZ = isNearStatue
        ? (isGiftOffering ? 3.45 : 4.2) + altarRow * 0.42
        : (isGiftOffering ? 4.7 : 6) + altarRow * 0.52;
      const altarStepZ = isNearStatue ? 5.8 : isGiftOffering ? 6.25 : 7.35;
      const mobileAltarTarget = new Vector3(approachLane * 0.3, 0, altarTargetZ);
      return [
        new Vector3(approachLane * 0.35, 0, 12),
        new Vector3(approachLane, 0, 9.5),
        new Vector3(approachLane * 0.82, 0, altarStepZ),
        mobileAltarTarget,
      ];
    }
    const gate = inside ? interiorGate : outdoorGate;
    const aisle = inside ? interiorAisle : outdoorCourtyard;
    const shrine = inside ? interiorShrine : outdoorShrine;
    const flowers = inside ? interiorFlowers : outdoorFlowers;
    const offeringTarget = ceremony && action.actionType === 'OFFER_FLOWERS' ? flowers : shrine;
    if (inside) {
      return [
        new Vector3(approachLane * 0.35, 0, gate.z),
        new Vector3(approachLane, 0, aisle.z),
        new Vector3(approachLane * 0.8, 0, interiorAltarStep.z),
        new Vector3(approachLane * 0.7, 0, offeringTarget.z + altarRow * 0.42),
      ];
    }
    return [gate, aisle, offeringTarget];
  }, [
    action.actionType,
    altarRow,
    approachLane,
    ceremony,
    inside,
    isGiftOffering,
    mobile,
    worshipDistance,
  ]);
  const returnPath = useMemo(() => {
    const visibleVisitors = mobile ? seatedVisitors.slice(0, 24) : seatedVisitors;
    const seatIndex = visibleVisitors.findIndex((visitor) => visitor.userId === action.userId);
    const [seatX, seatY, seatZ] = mobile
      ? getMobileSeatPosition(seatIndex >= 0 ? seatIndex : 0)
      : getSeatPosition(seatIndex >= 0 ? seatIndex : 0);
    if (!inside) return [exit];
    const side = seatX < 0 ? -1 : 1;
    if (mobile) {
      return [
        new Vector3(side * 2, 0, 6.5),
        new Vector3(side * 5.1, 0, 6.5),
        new Vector3(side * 5.1, 0, seatZ),
        new Vector3(seatX, seatY, seatZ),
      ];
    }
    return [
      new Vector3(side * 4.2, 0, 0.65),
      new Vector3(side * 11.6, 0, 0.65),
      new Vector3(side * 11.6, 0, seatZ),
      new Vector3(seatX, seatY, seatZ),
    ];
  }, [action.userId, inside, mobile, seatedVisitors]);
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
    const depthScale = inside ? 0.34 + depthProgress * 0.46 : 0.8;
    const smoothScale = MathUtils.lerp(
      group.scale.x,
      depthScale,
      Math.min(1, delta * 4.5),
    );
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
      group.scale.setScalar(0.8);
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
      if (distance < 0.12) {
        if (currentState === 'EXITING') {
          returnPathIndex.current++;
          if (returnPathIndex.current >= returnPath.length) {
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
          elapsed.current = 0;
          if (action.actionType === 'OFFER_FLOWERS') setState(action.actionId, 'OFFERING_FLOWERS');
          else if (action.actionType === 'PRAY' || action.actionType === 'ENTER_TEMPLE')
            setState(action.actionId, 'PRAYING');
          else if (action.actionType === 'OFFER_INCENSE') setState(action.actionId, 'BOWING');
          else setState(action.actionId, 'WAITING');
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
      if (currentState === 'OFFERING_FLOWERS' && !offered.current && elapsed.current > 1.1) {
        offered.current = true;
        addFlower();
      }
      if (elapsed.current > (currentState === 'OFFERING_FLOWERS' ? 3.2 : 2.4)) {
        elapsed.current = 0;
        if (currentState === 'OFFERING_FLOWERS') setState(action.actionId, 'PRAYING');
        else if (currentState === 'PRAYING' && ceremony) setState(action.actionId, 'BOWING');
        else {
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
    <group ref={root} position={[spawn.x, spawn.y, spawn.z]} scale={0.8}>
      {displayedMessage && <CharacterCommentBubble message={displayedMessage} mobile={mobile} />}
      {mobile && <MobileOfferingBadge action={action} state={character.state} />}
      {mobile && (
        <MobileWorshipper
          name={action.nickname}
          state={character.state}
          showName={!shouldHideName}
          avatarUrl={action.avatarUrl}
          female={isFemaleCharacter}
        />
      )}
      <group ref={body} position={[0, 1.05, 0]} visible={!mobile}>
        {!shouldHideName && (
          <CharacterNameLabel
            name={action.nickname}
            avatarUrl={action.avatarUrl}
            position={[0, 1.6, 0]}
          />
        )}
        <mesh position={[0, 0.08, 0]} scale={[1, 1.08, 0.72]} castShadow>
          <capsuleGeometry args={[0.38, 0.86, 8, 14]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.92, 0]} scale={[0.9, 1.08, 0.9]} castShadow>
          <sphereGeometry args={[0.34, 24, 18]} />
          <meshStandardMaterial color="#dca77e" />
        </mesh>
        <mesh position={[0, 1.06, -0.12]} scale={[0.94, 0.56, 0.92]} castShadow>
          <sphereGeometry args={[0.35, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color="#241714" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.92, 0.31]} scale={[0.42, 0.28, 0.35]}>
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshStandardMaterial color="#c98d6d" />
        </mesh>
        <group ref={leftArm} position={[-0.48, 0.3, 0]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.65, 4, 8]} />
            <meshStandardMaterial color="#dca77e" />
          </mesh>
          <mesh position={[0, -0.82, 0]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#dca77e" />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.48, 0.3, 0]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.65, 4, 8]} />
            <meshStandardMaterial color="#dca77e" />
          </mesh>
          <mesh position={[0, -0.82, 0]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#dca77e" />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.2, -0.65, 0]}>
          <mesh position={[0, -0.48, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.75, 4, 8]} />
            <meshStandardMaterial color="#28344c" />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.2, -0.65, 0]}>
          <mesh position={[0, -0.48, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.75, 4, 8]} />
            <meshStandardMaterial color="#28344c" />
          </mesh>
        </group>
        {carrying && action.actionType === 'OFFER_FLOWERS' && (
          <group position={[0, 0.2, 0.65]}>
            <mesh>
              <coneGeometry args={[0.28, 0.7, 9]} />
              <meshStandardMaterial color="#4c8a45" />
            </mesh>
            {[-0.18, 0, 0.18].map((x, i) => (
              <mesh key={i} position={[x, 0.42, 0]}>
                <sphereGeometry args={[0.14, 10, 8]} />
                <meshStandardMaterial color={i % 2 ? '#fff0f5' : '#ef5277'} />
              </mesh>
            ))}
          </group>
        )}
        {carrying && action.actionType === 'OFFER_INCENSE' && (
          <group position={[0, 0.18, 0.66]}>
            <mesh castShadow>
              <boxGeometry args={[0.72, 0.55, 0.58]} />
              <meshStandardMaterial color="#b52d36" roughness={0.58} />
            </mesh>
            <mesh position={[0, 0.02, 0.3]}>
              <boxGeometry args={[0.12, 0.58, 0.025]} />
              <meshStandardMaterial color="#efc34e" metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.31, 0]}>
              <torusGeometry args={[0.18, 0.055, 8, 18]} />
              <meshStandardMaterial color="#efc34e" metalness={0.3} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
