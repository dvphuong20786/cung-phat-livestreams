import { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Vector3 } from 'three';
import type { ActiveCharacter, CharacterState } from '../useTempleGameStore';
import { useTempleGameStore } from '../useTempleGameStore';
import { getSeatPosition } from './SeatedVisitors';
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
export function CharacterNameLabel({
  name,
  position = [0, 2.65, 0],
}: {
  name: string;
  position?: [number, number, number];
}) {
  return (
    <Html center position={position} distanceFactor={13} zIndexRange={[10, 0]}>
      <div className="whitespace-nowrap rounded-full border border-white/20 bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
        {name}
      </div>
    </Html>
  );
}
export function Character({
  character,
  inside = false,
  mobile = false,
}: {
  character: ActiveCharacter;
  inside?: boolean;
  mobile?: boolean;
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
  const { paused, setState, complete, addFlower, seatedVisitors } = useTempleGameStore();
  const action = character.action;
  const color = useMemo(
    () =>
      colors[Math.abs([...action.userId].reduce((n, c) => n + c.charCodeAt(0), 0)) % colors.length],
    [action.userId],
  );
  const ceremony = action.actionType === 'OFFER_FLOWERS' || action.actionType === 'OFFER_INCENSE';
  const path = useMemo(() => {
    const gate = inside ? interiorGate : outdoorGate;
    const aisle = inside ? interiorAisle : outdoorCourtyard;
    const shrine = inside ? interiorShrine : outdoorShrine;
    const flowers = inside ? interiorFlowers : outdoorFlowers;
    const offeringTarget =
      ceremony && action.actionType === 'OFFER_FLOWERS' ? flowers : shrine;
    if (inside) return [gate, aisle, interiorAltarStep, offeringTarget];
    return [gate, aisle, offeringTarget];
  }, [action.actionType, ceremony, inside]);
  const returnPath = useMemo(() => {
    const seatIndex = seatedVisitors.findIndex((visitor) => visitor.userId === action.userId);
    const [originalSeatX, seatY, seatZ] = getSeatPosition(seatIndex >= 0 ? seatIndex : 0);
    const horizontalScale = mobile ? 0.43 : 1;
    const seatX = originalSeatX * horizontalScale;
    if (!inside) return [exit];
    const side = seatX < 0 ? -1 : 1;
    return [
      new Vector3(side * 4.2 * horizontalScale, 0, 0.65),
      new Vector3(side * 11.6 * horizontalScale, 0, 0.65),
      new Vector3(side * 11.6 * horizontalScale, 0, seatZ),
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
    <group ref={root} scale={0.8}>
      <group ref={body} position={[0, 1.05, 0]}>
        <CharacterNameLabel name={action.nickname} position={[0, 1.6, 0]} />
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
