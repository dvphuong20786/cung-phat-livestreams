import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { TempleGameAction } from '@live/shared';
import { MeritLeaderboard } from '../game/components/MeritLeaderboard';
import { RecentDonorsList } from '../game/components/RecentDonorsList';
import {
  Overlay2DToolbar,
  type Overlay2DQuality,
  type Overlay2DView,
} from '../game/Overlay2DToolbar';
import { calculateSeatingDuration } from '../game/seatingDuration';
import { getCultivationInfo } from '../game/cultivationLevel';
import { templeAudio } from '../game/services/TempleAudioService';
import type { TempleTheme, WorshipDistance } from '../game/TempleScene';
import {
  useTempleGameStore,
  type ActiveCharacter,
  type CharacterState,
} from '../game/useTempleGameStore';
import { sendSimulatedBatch } from '../services/simulatorService';
import { useMonitorStore } from '../stores/useMonitorStore';

const fakePrayers = [
  'Nam mô A Di Đà Phật',
  'Nguyện gia đình bình an',
  'Cầu mong mọi người an lạc',
  'Xin thành tâm lễ Phật',
  'Nguyện phước lành đến muôn nơi',
];

function hashText(value: string): number {
  return Math.abs([...value].reduce((total, character) => total + character.charCodeAt(0), 0));
}

function getDisplayedMessage(action: TempleGameAction): string | undefined {
  if (action.message?.trim()) return action.message.trim();
  if (action.eventType === 'LIKE') {
    return (action.quantity ?? 1) > 1
      ? `❤️ Thả ${action.quantity} tim cúng Phật`
      : '❤️ Thả tim cúng Phật';
  }
  if (action.isSimulated) return fakePrayers[hashText(action.userId) % fakePrayers.length];
  return undefined;
}

function CharacterLabel({ action }: { action: TempleGameAction }) {
  const message = getDisplayedMessage(action);
  const interactions = useTempleGameStore((store) => store.userInteractions[action.userId] || 0);
  const cultivation = getCultivationInfo(interactions, hashText(action.userId) % 12 !== 0);
  const hideGenericName =
    action.isSimulated === true &&
    /^kh[aá]n gi[aả](?:\s+\d+)?$/i.test(action.nickname.normalize('NFC').trim());

  if (message) {
    return (
      <div className="mobile-2d-speech">
        {action.avatarUrl && <img src={action.avatarUrl} alt="" />}
        <b title={cultivation.title}>Lv.{cultivation.level}</b>
        <span>{message.length > 72 ? `${message.slice(0, 72)}…` : message}</span>
      </div>
    );
  }
  if (hideGenericName) return null;

  return (
    <div className="mobile-2d-name">
      {action.avatarUrl && <img src={action.avatarUrl} alt="" />}
      <b title={cultivation.title}>Lv.{cultivation.level}</b>
      <span>{action.nickname}</span>
    </div>
  );
}

function CharacterSprite({
  action,
  state,
  seated = false,
}: {
  action: TempleGameAction;
  state?: CharacterState;
  seated?: boolean;
}) {
  const interactions = useTempleGameStore((store) => store.userInteractions[action.userId] || 0);
  const isFemale = hashText(action.userId) % 12 !== 0;
  const cultivation = getCultivationInfo(interactions, isFemale);
  const bowing = seated || state === 'BOWING';
  const praying = state === 'PRAYING' || state === 'WAITING';
  const offering = state === 'OFFERING_FLOWERS';
  const spriteClass = bowing
    ? 'mobile-2d-rank-bow'
    : offering
      ? 'mobile-2d-rank-offering'
      : praying
        ? 'mobile-2d-rank-praying'
        : 'mobile-2d-rank-walk';
  return (
    <>
      {cultivation.hasHalo && <div className="mobile-2d-halo" />}
      <div
        className={`mobile-2d-sprite mobile-2d-rank-sprite ${spriteClass}`}
        style={{ backgroundImage: `url('${cultivation.assetUrl}')` }}
        aria-hidden="true"
      />
    </>
  );
}

function Offering({ action, state }: { action: TempleGameAction; state: CharacterState }) {
  if (state === 'EXITING' || state === 'COMPLETED') return null;
  const isFlower = action.actionType === 'OFFER_FLOWERS';
  const isGift = action.eventType === 'GIFT' || action.actionType === 'OFFER_INCENSE';
  if (!isFlower && !isGift) return null;
  return (
    <div className="mobile-2d-offering">
      <strong>{isFlower ? '💐' : '🎁'}</strong>
      <span>{action.giftName || (isFlower ? 'Hoa cúng Phật' : 'Lễ vật')}</span>
      {(action.quantity ?? 1) > 1 && <b>×{action.quantity}</b>}
    </div>
  );
}

function Mobile2DCharacter({
  character,
  lane,
  paused,
}: {
  character: ActiveCharacter;
  lane: number;
  paused: boolean;
}) {
  const { setState, complete, addFlower } = useTempleGameStore();
  const action = character.action;
  const state = character.state;
  const offered = useRef(false);
  const isJoinOnly = action.eventType === 'JOIN';
  const isDonation =
    action.eventType === 'GIFT' ||
    action.actionType === 'OFFER_FLOWERS' ||
    action.actionType === 'OFFER_INCENSE';

  useEffect(() => {
    if (paused) return;
    let timer: number | undefined;
    let offeringTimer: number | undefined;

    if (state === 'SPAWNING') {
      setState(action.actionId, 'WALKING_TO_ALTAR');
    } else if (state === 'WALKING_TO_GATE' || state === 'WALKING_TO_ALTAR') {
      timer = window.setTimeout(
        () => {
          if (isJoinOnly) {
            complete(action.actionId);
            return;
          }
          if (action.actionType === 'OFFER_FLOWERS') {
            setState(action.actionId, 'OFFERING_FLOWERS');
          } else if (isDonation) {
            setState(action.actionId, 'BOWING');
          } else {
            setState(action.actionId, 'PRAYING');
          }
        },
        isJoinOnly ? 4200 : 5200,
      );
    } else if (state === 'OFFERING_FLOWERS') {
      if (!offered.current) {
        offeringTimer = window.setTimeout(() => {
          offered.current = true;
          addFlower();
        }, 1500);
      }
      timer = window.setTimeout(() => setState(action.actionId, 'BOWING'), 10_000);
    } else if (state === 'PRAYING' || state === 'BOWING' || state === 'WAITING') {
      timer = window.setTimeout(
        () => setState(action.actionId, 'EXITING'),
        isDonation ? 10_000 : 5_000,
      );
    } else if (state === 'EXITING') {
      timer = window.setTimeout(() => complete(action.actionId), 5200);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      if (offeringTimer) window.clearTimeout(offeringTimer);
    };
  }, [
    action.actionId,
    action.actionType,
    addFlower,
    complete,
    isDonation,
    isJoinOnly,
    paused,
    setState,
    state,
  ]);

  const laneOffset = [-11, -4, 4, 11][lane % 4];
  const exitSide = hashText(action.userId) % 2 === 0 ? -1 : 1;
  const style = {
    '--lane-x': `${laneOffset}%`,
    '--exit-x': `${exitSide * 35}%`,
  } as CSSProperties;
  const className = isJoinOnly
    ? 'mobile-2d-person mobile-2d-person-join'
    : state === 'EXITING'
      ? 'mobile-2d-person mobile-2d-person-exit'
      : state === 'WALKING_TO_ALTAR' || state === 'WALKING_TO_GATE' || state === 'SPAWNING'
        ? 'mobile-2d-person mobile-2d-person-enter'
        : 'mobile-2d-person mobile-2d-person-worship';

  return (
    <div className={className} style={style}>
      <CharacterLabel action={action} />
      <Offering action={action} state={state} />
      <CharacterSprite action={action} state={state} />
    </div>
  );
}

function Mobile2DSeatedVisitors({
  hideSimulated,
  mobile,
}: {
  hideSimulated: boolean;
  mobile: boolean;
}) {
  const seatedVisitors = useTempleGameStore((state) => state.seatedVisitors);
  const active = useTempleGameStore((state) => state.active);
  const userInteractions = useTempleGameStore((state) => state.userInteractions);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const activeUsers = useMemo(() => new Set(active.map((item) => item.action.userId)), [active]);

  const visibleVisitors = useMemo(
    () =>
      seatedVisitors
        .filter((visitor) => {
          if (hideSimulated && visitor.isSimulated) return false;
          if (activeUsers.has(visitor.userId)) return false;
          const duration = calculateSeatingDuration(visitor, userInteractions[visitor.userId] || 0);
          return now - (visitor.seatedAt ?? visitor.createdAt) <= duration;
        })
        .slice(0, 24),
    [activeUsers, hideSimulated, now, seatedVisitors, userInteractions],
  );

  return (
    <div className="mobile-2d-seats">
      {visibleVisitors.map((visitor, index) => {
        const seatIndex = visitor.seatIndex ?? index;
        const mobileRow = Math.floor((seatIndex % 24) / 6);
        const mobileColumn = seatIndex % 6;
        const desktopRow = Math.floor((seatIndex % 24) / 12);
        const desktopColumn = seatIndex % 12;
        const mobilePositions = [10, 24, 37, 63, 76, 90];
        const desktopPositions = [9, 16, 23, 30, 37, 44, 56, 63, 70, 77, 84, 91];
        const row = mobile ? mobileRow : desktopRow;
        const column = mobile ? mobileColumn : desktopColumn;
        const positions = mobile ? mobilePositions : desktopPositions;
        const style = {
          left: `${positions[column]}%`,
          top: `${mobile ? 55 + row * 10 : 64 + row * 15}%`,
          zIndex: 40 - row,
          transform: `translate(-50%, -50%) scale(${mobile ? 0.68 + row * 0.08 : 0.62 + row * 0.14})`,
        } as CSSProperties;
        return (
          <div className="mobile-2d-seated" style={style} key={visitor.userId}>
            <CharacterLabel action={visitor} />
            <CharacterSprite action={visitor} seated />
          </div>
        );
      })}
    </div>
  );
}

function Temple2DDecorations({ flowers, theme }: { flowers: number; theme: TempleTheme }) {
  return (
    <div className="temple-2d-decorations" aria-hidden="true">
      {theme === 'INTERIOR' && (
        <>
          <img
            className="temple-2d-monk temple-2d-monk-left"
            src="/assets/monk-kneeling-yellow.png"
            alt=""
          />
          <img
            className="temple-2d-monk temple-2d-monk-right"
            src="/assets/monk-kneeling-yellow.png"
            alt=""
          />
        </>
      )}
      <div className="temple-2d-flower-table">
        {Array.from({ length: Math.min(12, flowers) }, (_, index) => (
          <span key={index}>🌸</span>
        ))}
      </div>
    </div>
  );
}

export function Mobile2DOverlayPage({ mobile = true }: { mobile?: boolean }) {
  const { active, allowSimulated, clear, flowers } = useTempleGameStore();
  const connection = useMonitorStore((state) => state.connection);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<Overlay2DView>('OVERVIEW');
  const [quality, setQuality] = useState<Overlay2DQuality>('MEDIUM');
  const [theme, setTheme] = useState<TempleTheme>('INTERIOR');
  const [worshipDistance, setWorshipDistance] = useState<WorshipDistance>('NEAR');
  const hideSimulated = !allowSimulated;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('sound') === '1' || searchParams.get('muted') === '0') {
      templeAudio.setMuted(false);
    } else if (searchParams.get('sound') === '0' || searchParams.get('muted') === '1') {
      templeAudio.setMuted(true);
    }
    if (!templeAudio.getMuted()) templeAudio.startBgm();
    const unlockAudio = () => {
      if (!templeAudio.getMuted()) templeAudio.startBgm();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      templeAudio.pauseBgm();
    };
  }, []);

  useEffect(() => {
    if (!allowSimulated || connection.state === 'CONNECTED') return;
    let timer: number | undefined;
    let cancelled = false;
    const runSimulationCycle = async () => {
      if (cancelled) return;
      await sendSimulatedBatch();
      if (!cancelled) timer = window.setTimeout(runSimulationCycle, 5000);
    };
    timer = window.setTimeout(runSimulationCycle, 2500);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [allowSimulated, connection.state]);

  return (
    <main
      className={`mobile-2d-stage ${mobile ? 'mobile-2d-stage--mobile' : 'mobile-2d-stage--desktop'} mobile-2d-theme-${theme.toLowerCase()} mobile-2d-worship-${worshipDistance.toLowerCase()} mobile-2d-view-${view.toLowerCase()} mobile-2d-quality-${quality.toLowerCase()} ${paused ? 'mobile-2d-paused' : ''}`}
    >
      <div className="mobile-2d-light" />
      <Temple2DDecorations flowers={flowers} theme={theme} />
      <Mobile2DSeatedVisitors hideSimulated={hideSimulated} mobile={mobile} />
      <div className="mobile-2d-active-layer">
        {active
          .filter((character) => !(hideSimulated && character.action.isSimulated))
          .map((character, index) => (
            <Mobile2DCharacter
              key={character.action.actionId}
              character={character}
              lane={index}
              paused={paused}
            />
          ))}
      </div>
      <div className="absolute left-2 top-14 z-50">
        <RecentDonorsList mobile />
      </div>
      <div className="absolute right-2 top-14 z-50">
        <MeritLeaderboard mobile />
      </div>

      {toolbarVisible ? (
        <div className="mobile-2d-toolbar-wrap">
          <Overlay2DToolbar
            paused={paused}
            setPaused={setPaused}
            clearScene={clear}
            view={view}
            setView={setView}
            quality={quality}
            setQuality={setQuality}
            theme={theme}
            setTheme={setTheme}
            worshipDistance={worshipDistance}
            setWorshipDistance={setWorshipDistance}
            mobile={mobile}
          />
          <button type="button" onClick={() => setToolbarVisible(false)}>
            <EyeOff size={14} /> Ẩn
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mobile-2d-show-toolbar"
          onClick={() => setToolbarVisible(true)}
          aria-label="Hiện thanh điều khiển"
        >
          <Eye size={16} />
        </button>
      )}
    </main>
  );
}
