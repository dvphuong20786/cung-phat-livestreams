import { useState } from 'react';
import { Camera, ExternalLink, Pause, Play, Trash2, Users, Volume2, VolumeX } from 'lucide-react';
import { command } from '../services/socket';
import { useTempleGameStore } from './useTempleGameStore';
import type { CameraPreset, TempleTheme, WorshipDistance } from './TempleScene';
import { templeAudio } from './services/TempleAudioService';

interface TempleToolbarProps {
  preset: CameraPreset;
  setPreset: (preset: CameraPreset) => void;
  theme: TempleTheme;
  setTheme: (theme: TempleTheme) => void;
  compact?: boolean;
  worshipDistance?: WorshipDistance;
  setWorshipDistance?: (distance: WorshipDistance) => void;
  extraAction?: React.ReactNode;
}

export function TempleToolbar({
  preset,
  setPreset,
  theme,
  setTheme,
  compact = false,
  worshipDistance,
  setWorshipDistance,
  extraAction,
}: TempleToolbarProps) {
  const { paused, quality, setQuality, allowSimulated, clear, setPaused } = useTempleGameStore();
  const [isMuted, setIsMuted] = useState(() => templeAudio.getMuted());
  const [volume, setVolume] = useState(() => templeAudio.getVolume());

  const handleToggleAudio = () => {
    const nextMuted = templeAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = parseFloat(e.target.value);
    templeAudio.setVolume(nextVol);
    setVolume(nextVol);
    if (isMuted && nextVol > 0) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/75 text-xs shadow-xl backdrop-blur-xl ${compact ? 'p-2' : 'p-3'}`}
    >
      <button
        className="btn bg-white/10 px-3 py-2"
        onClick={() => {
          setPaused(!paused);
          command('game:control', { command: paused ? 'RESUME' : 'PAUSE' }).catch(() => {});
        }}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Tiếp tục' : 'Tạm dừng'}
      </button>
      <button
        className="btn bg-red-500/15 px-3 py-2 text-red-200"
        onClick={() => {
          clear();
          command('game:control', { command: 'CLEAR' }).catch(() => {});
        }}
      >
        <Trash2 size={14} /> Xóa cảnh
      </button>
      <button
        type="button"
        className={`btn px-2.5 py-1.5 transition ${
          allowSimulated
            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
            : 'border border-slate-700 bg-slate-900/60 text-slate-400'
        }`}
        onClick={() => {
          command('simulator:auto-control', { enabled: !allowSimulated }).catch(() => {});
        }}
        title="Bật / Tắt giả lập tự động dùng chung với trang Admin"
      >
        <Users size={13} /> {allowSimulated ? 'Giả lập: Bật' : 'Giả lập: Tắt'}
      </button>

      {/* Nút Bật/Tắt Âm thanh & Tiếng Chuông Mõ */}
      <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 px-2 py-1">
        <button
          type="button"
          className={`flex items-center gap-1.5 font-medium transition ${
            !isMuted ? 'text-amber-300 font-bold' : 'text-slate-400'
          }`}
          onClick={handleToggleAudio}
          title={isMuted ? 'Bấm để bật âm thanh & tiếng chuông mõ' : 'Bấm để tắt âm thanh'}
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
            title={`Âm lượng: ${Math.round(volume * 100)}%`}
          />
        )}
      </div>

      {/* 3 Nút Chủ Động Gõ Âm Thanh Nghi Lễ */}
      <div className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-950/30 px-1.5 py-1">
        <button
          type="button"
          onClick={() => {
            if (isMuted) {
              templeAudio.setMuted(false);
              setIsMuted(false);
            }
            templeAudio.playWoodenFish(0);
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30 active:scale-90"
          title="Bấm để gõ mõ"
        >
          🪵 Mõ
        </button>
        <button
          type="button"
          onClick={() => {
            if (isMuted) {
              templeAudio.setMuted(false);
              setIsMuted(false);
            }
            templeAudio.playTempleBell(1.0);
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30 active:scale-90"
          title="Bấm để đánh chuông"
        >
          🔔 Chuông
        </button>
        <button
          type="button"
          onClick={() => {
            if (isMuted) {
              templeAudio.setMuted(false);
              setIsMuted(false);
            }
            templeAudio.playOfferingChime();
          }}
          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30 active:scale-90"
          title="Bấm để đánh khánh"
        >
          ✨ Khánh
        </button>
      </div>
      <select
        aria-label="Giao diện chùa"
        className="rounded-lg border border-amber-300/30 bg-amber-950/80 px-3 py-1.5 text-amber-100"
        value={theme}
        onChange={(event) => setTheme(event.target.value as TempleTheme)}
      >
        <option value="COURTYARD">Ngoại cảnh</option>
        <option value="INTERIOR">Nội điện</option>
      </select>
      {worshipDistance && setWorshipDistance && (
        <select
          aria-label="Vị trí hành lễ"
          className="rounded-lg border border-amber-300/30 bg-amber-950/80 px-3 py-1.5 text-amber-100"
          value={worshipDistance}
          onChange={(event) => setWorshipDistance(event.target.value as WorshipDistance)}
        >
          <option value="NEAR">Lễ gần tượng</option>
          <option value="STANDARD">Lễ cuối thảm</option>
        </select>
      )}
      <span className="mx-1 h-5 w-px bg-white/15" />
      <Camera size={14} className="text-amber-300" />
      {(['OVERVIEW', 'ENTRANCE', 'SHRINE'] as CameraPreset[]).map((cameraPreset) => (
        <button
          key={cameraPreset}
          className={`rounded-lg px-2 py-1.5 ${preset === cameraPreset ? 'bg-amber-400 text-slate-950' : 'bg-white/5'}`}
          onClick={() => setPreset(cameraPreset)}
        >
          {cameraPreset === 'OVERVIEW'
            ? 'Toàn cảnh'
            : cameraPreset === 'ENTRANCE'
              ? theme === 'INTERIOR'
                ? 'Lối vào'
                : 'Cổng chùa'
              : 'Điện Phật'}
        </button>
      ))}
      <select
        className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5"
        value={quality}
        onChange={(event) => setQuality(event.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
      >
        <option value="LOW">Đồ họa thấp</option>
        <option value="MEDIUM">Đồ họa vừa</option>
        <option value="HIGH">Đồ họa cao</option>
      </select>
      {extraAction}
      {!compact && (
        <a className="btn bg-violet-500/20 px-3 py-2 text-violet-200" href="/admin">
          <ExternalLink size={14} /> Quản trị
        </a>
      )}
    </div>
  );
}
