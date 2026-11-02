import { useState, type ChangeEvent } from 'react';
import { Camera, Pause, Play, Trash2, Users, Volume2, VolumeX } from 'lucide-react';
import { templeAudio } from './services/TempleAudioService';
import { useTempleGameStore } from './useTempleGameStore';
import type { TempleTheme, WorshipDistance } from './TempleScene';

export type Overlay2DView = 'OVERVIEW' | 'ENTRANCE' | 'SHRINE';
export type Overlay2DQuality = 'LOW' | 'MEDIUM' | 'HIGH';

interface Overlay2DToolbarProps {
  paused: boolean;
  setPaused: (paused: boolean) => void;
  clearScene: () => void;
  view: Overlay2DView;
  setView: (view: Overlay2DView) => void;
  quality: Overlay2DQuality;
  setQuality: (quality: Overlay2DQuality) => void;
  theme: TempleTheme;
  setTheme: (theme: TempleTheme) => void;
  worshipDistance: WorshipDistance;
  setWorshipDistance: (distance: WorshipDistance) => void;
  mobile: boolean;
}

export function Overlay2DToolbar({
  paused,
  setPaused,
  clearScene,
  view,
  setView,
  quality,
  setQuality,
  theme,
  setTheme,
  worshipDistance,
  setWorshipDistance,
  mobile,
}: Overlay2DToolbarProps) {
  const { allowSimulated, setAllowSimulated } = useTempleGameStore();
  const [isMuted, setIsMuted] = useState(() => templeAudio.getMuted());
  const [volume, setVolume] = useState(() => templeAudio.getVolume());

  const handleToggleAudio = () => setIsMuted(templeAudio.toggleMute());
  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    templeAudio.setVolume(nextVolume);
    setVolume(nextVolume);
    if (isMuted && nextVolume > 0) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
  };
  const ensureAudioEnabled = () => {
    if (!isMuted) return;
    templeAudio.setMuted(false);
    setIsMuted(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/75 p-2 text-xs shadow-xl backdrop-blur-xl">
      <button className="btn bg-white/10 px-3 py-2" onClick={() => setPaused(!paused)}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
        {paused ? 'Tiếp tục' : 'Tạm dừng'}
      </button>
      <button className="btn bg-red-500/15 px-3 py-2 text-red-200" onClick={clearScene}>
        <Trash2 size={14} /> Xóa cảnh
      </button>
      <button
        type="button"
        className={`btn px-2.5 py-1.5 transition ${
          allowSimulated
            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
            : 'border border-slate-700 bg-slate-900/60 text-slate-400'
        }`}
        onClick={() => setAllowSimulated(!allowSimulated)}
      >
        <Users size={13} /> {allowSimulated ? 'Giả lập: Bật' : 'Giả lập: Tắt'}
      </button>

      <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 px-2 py-1">
        <button
          type="button"
          className={`flex items-center gap-1.5 font-medium transition ${
            !isMuted ? 'font-bold text-amber-300' : 'text-slate-400'
          }`}
          onClick={handleToggleAudio}
        >
          {!isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{!isMuted ? 'Nhạc: Bật' : 'Nhạc: Tắt'}</span>
        </button>
        {!isMuted && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-14 cursor-pointer accent-amber-400"
          />
        )}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-950/30 px-1.5 py-1">
        <button
          type="button"
          onClick={() => {
            ensureAudioEnabled();
            templeAudio.playWoodenFish(0);
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
        >
          🪵 Mõ
        </button>
        <button
          type="button"
          onClick={() => {
            ensureAudioEnabled();
            templeAudio.playTempleBell(1);
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
        >
          🔔 Chuông
        </button>
        <button
          type="button"
          onClick={() => {
            ensureAudioEnabled();
            templeAudio.playOfferingChime();
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
        >
          ✨ Khánh
        </button>
      </div>

      <select
        aria-label="Giao diện 2D"
        className="rounded-lg border border-amber-300/30 bg-amber-950/80 px-3 py-1.5 text-amber-100"
        value={theme}
        onChange={(event) => setTheme(event.target.value as TempleTheme)}
      >
        <option value="COURTYARD">Ngoại cảnh</option>
        <option value="INTERIOR">Nội điện</option>
      </select>
      <select
        aria-label="Vị trí hành lễ 2D"
        className="rounded-lg border border-amber-300/30 bg-amber-950/80 px-3 py-1.5 text-amber-100"
        value={worshipDistance}
        onChange={(event) => setWorshipDistance(event.target.value as WorshipDistance)}
      >
        <option value="NEAR">Lễ gần tượng</option>
        <option value="STANDARD">Lễ cuối thảm</option>
      </select>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <Camera size={14} className="text-amber-300" />
      {(['OVERVIEW', 'ENTRANCE', 'SHRINE'] as Overlay2DView[]).map((nextView) => (
        <button
          key={nextView}
          className={`rounded-lg px-2 py-1.5 ${
            view === nextView ? 'bg-amber-400 text-slate-950' : 'bg-white/5'
          }`}
          onClick={() => setView(nextView)}
        >
          {nextView === 'OVERVIEW'
            ? 'Toàn cảnh'
            : nextView === 'ENTRANCE'
              ? theme === 'INTERIOR'
                ? 'Lối vào'
                : 'Cổng chùa'
              : 'Điện Phật'}
        </button>
      ))}
      <select
        aria-label="Chất lượng hiệu ứng 2D"
        className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5"
        value={quality}
        onChange={(event) => setQuality(event.target.value as Overlay2DQuality)}
      >
        <option value="LOW">Đồ họa thấp</option>
        <option value="MEDIUM">Đồ họa vừa</option>
        <option value="HIGH">Đồ họa cao</option>
      </select>
      <a
        className="rounded-lg bg-violet-500/20 px-2 py-1.5 font-bold text-violet-200"
        href={mobile ? '/overlay-mobile' : '/overlay'}
      >
        Bản 3D
      </a>
    </div>
  );
}
