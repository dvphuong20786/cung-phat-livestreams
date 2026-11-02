import { useState, useEffect } from 'react';
import { Music, Volume2, VolumeX, Bell, Play, Pause, Disc3, Sparkles } from 'lucide-react';
import { templeAudio } from '../../game/services/TempleAudioService';

export function AudioSettingsPanel() {
  const [isMuted, setIsMuted] = useState(() => templeAudio.getMuted());
  const [volume, setVolume] = useState(() => templeAudio.getVolume());
  const [isPlayingTestBgm, setIsPlayingTestBgm] = useState(false);
  const [customBgmUrl, setCustomBgmUrl] = useState(() => {
    return localStorage.getItem('temple_bgm_url') || '/audio/bgm.mp3';
  });

  useEffect(() => {
    localStorage.setItem('temple_bgm_url', customBgmUrl);
  }, [customBgmUrl]);

  const handleToggleMute = () => {
    const next = templeAudio.toggleMute();
    setIsMuted(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    templeAudio.setVolume(v);
    if (isMuted && v > 0) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
  };

  const handleTestWoodenFish = () => {
    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    templeAudio.playWoodenFish(0);
  };

  const handleTestBell = () => {
    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    templeAudio.playTempleBell(1.0);
  };

  const handleTestChime = () => {
    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    templeAudio.playOfferingChime();
  };

  const handleToggleBgm = () => {
    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    if (isPlayingTestBgm) {
      templeAudio.pauseBgm();
      setIsPlayingTestBgm(false);
    } else {
      templeAudio.startBgm();
      setIsPlayingTestBgm(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Khối điều khiển chính */}
      <section className="card p-6 border-amber-500/20 bg-gradient-to-b from-[#18110c]/90 to-[#0e0906]/95 text-amber-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-md">
              <Music size={20} />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-amber-200">
                Âm Thanh & Nhạc Chánh Điện 3D
              </h2>
              <p className="text-xs text-amber-300/60">
                Tùy chỉnh nhạc nền thiền tĩnh tâm và hiệu ứng tiếng chuông mõ nghi lễ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-xs shadow-lg transition ${
              !isMuted
                ? 'border border-amber-400 bg-amber-500 text-slate-950 shadow-amber-500/30'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {!isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{!isMuted ? 'Đang bật âm thanh' : 'Đang tắt tiếng'}</span>
          </button>
        </div>

        {/* Thanh trượt âm lượng */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-200/90">Âm lượng tổng (Master Volume)</span>
            <span className="font-mono text-amber-400">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer accent-amber-400"
          />
        </div>
      </section>

      {/* Khối nhạc nền BGM */}
      <section className="card p-6 border-white/10 bg-[#0d111e]/90 text-slate-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Disc3 size={18} className="text-violet-400" />
            <h3 className="font-bold text-sm text-slate-100">Nhạc nền chánh điện (BGM)</h3>
          </div>
          <button
            type="button"
            onClick={handleToggleBgm}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              isPlayingTestBgm
                ? 'border border-violet-400 bg-violet-600 text-white'
                : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isPlayingTestBgm ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlayingTestBgm ? 'Dừng nhạc' : 'Nghe thử nhạc'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Đường dẫn file nhạc nền (.mp3 hoặc .wav)
            </label>
            <input
              type="text"
              value={customBgmUrl}
              onChange={(e) => setCustomBgmUrl(e.target.value)}
              placeholder="/audio/bgm.mp3 hoặc URL nhạc online"
              className="field w-full text-xs font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              💡 Bạn chỉ cần copy file nhạc vào thư mục <code className="text-amber-300">apps/web/public/audio/bgm.mp3</code>, hệ thống sẽ tự động phát lặp lại. Nếu chưa có file MP3, hệ thống sẽ tự phát nhạc thiền thanh tịnh Ambient Drone.
            </p>
          </div>
        </div>
      </section>

      {/* Khối thử nghiệm tiếng Chuông & Mõ SFX */}
      <section className="card p-6 border-white/10 bg-[#0d111e]/90 text-slate-200">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Bell size={18} className="text-amber-400" />
          <h3 className="font-bold text-sm text-slate-100">Âm thanh nghi lễ Phật giáo (SFX)</h3>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* Nút thử gõ mõ */}
          <button
            type="button"
            onClick={handleTestWoodenFish}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/40 text-amber-300">
              🪵
            </div>
            <div className="font-bold text-xs text-amber-200">Tiếng Gõ Mõ</div>
            <div className="text-[10px] text-slate-400">Âm sắc mộc 540Hz thanh tịnh</div>
          </button>

          {/* Nút thử chuông đại hồng chung */}
          <button
            type="button"
            onClick={handleTestBell}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/40 text-amber-300">
              🔔
            </div>
            <div className="font-bold text-xs text-amber-200">Đại Hồng Chung</div>
            <div className="text-[10px] text-slate-400">Chuông chùa ngân vang 5.5s</div>
          </button>

          {/* Nút thử tiếng khánh dâng hoa */}
          <button
            type="button"
            onClick={handleTestChime}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/40 text-amber-300">
              ✨
            </div>
            <div className="font-bold text-xs text-amber-200">Tiếng Khánh Dâng Hoa</div>
            <div className="text-[10px] text-slate-400">Ngân nga trong trẻo khi cúng dường</div>
          </button>
        </div>
      </section>
    </div>
  );
}

