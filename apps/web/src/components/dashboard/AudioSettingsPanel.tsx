import { useState, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Bell,
  Play,
  Pause,
  Disc3,
  Upload,
  ExternalLink,
  HelpCircle,
  FileAudio,
} from 'lucide-react';
import { templeAudio } from '../../game/services/TempleAudioService';

interface PresetTrack {
  id: string;
  label: string;
  url: string;
  description: string;
}

const PRESET_TRACKS: PresetTrack[] = [
  {
    id: 'thien-tinh-tam',
    label: 'Nhạc chuông thiền tĩnh tâm (Có sẵn)',
    url: '/audio/bgm-thien-tinh-tam.wav',
    description: 'Hòa âm chuông thiền Tây Tạng êm dịu, tạo không gian trang nghiêm',
  },
  {
    id: 'bgm-default',
    label: 'Nhạc chánh điện mặc định (Có sẵn)',
    url: '/audio/bgm.wav',
    description: 'Bản nhạc nền chánh điện tiêu chuẩn trong thư mục public/audio/',
  },
  {
    id: 'synth-drone',
    label: 'Nhạc thiền Singing Bowl (Tự sinh trực tiếp)',
    url: 'synth',
    description: 'Tự động tạo âm thiền thanh tịnh liên tục không phụ thuộc file ngoài',
  },
  {
    id: 'custom-input',
    label: 'Đường dẫn nhạc tùy chỉnh (URL)',
    url: '',
    description: 'Nhập link file nhạc online hoặc đường dẫn file tùy ý',
  },
];

export function AudioSettingsPanel() {
  const [isMuted, setIsMuted] = useState(() => templeAudio.getMuted());
  const [volume, setVolume] = useState(() => templeAudio.getVolume());
  const [isPlayingTestBgm, setIsPlayingTestBgm] = useState(false);

  const initialUrl = templeAudio.getCurrentBgmUrl();
  const matchedPreset = PRESET_TRACKS.find((t) => t.url === initialUrl);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    matchedPreset ? matchedPreset.id : 'custom-input',
  );
  const [customBgmUrl, setCustomBgmUrl] = useState(() =>
    matchedPreset && matchedPreset.id !== 'custom-input' ? '' : initialUrl,
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    const track = PRESET_TRACKS.find((t) => t.id === trackId);
    if (track && track.id !== 'custom-input') {
      templeAudio.setBgmTrack(track.url);
      if (isPlayingTestBgm) {
        templeAudio.startBgm();
      }
    } else if (customBgmUrl.trim()) {
      templeAudio.setBgmTrack(customBgmUrl.trim());
      if (isPlayingTestBgm) {
        templeAudio.startBgm();
      }
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomBgmUrl(url);
    if (selectedTrackId === 'custom-input' && url.trim()) {
      templeAudio.setBgmTrack(url.trim());
      if (isPlayingTestBgm) {
        templeAudio.startBgm();
      }
    }
  };

  // Tải file trực tiếp từ máy tính
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setUploadedFileName(file.name);
    setSelectedTrackId('custom-input');
    setCustomBgmUrl(objectUrl);
    templeAudio.setBgmTrack(objectUrl);

    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    templeAudio.startBgm();
    setIsPlayingTestBgm(true);
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
      {/* Khối điều khiển âm thanh tổng */}
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

      {/* Khối chọn Nhạc Nền (BGM) qua Combobox */}
      <section className="card p-6 border-white/10 bg-[#0d111e]/90 text-slate-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Disc3 size={18} className="text-violet-400" />
            <h3 className="font-bold text-sm text-slate-100">Chọn Nhạc Nền Chánh Điện (BGM)</h3>
          </div>
          <button
            type="button"
            onClick={handleToggleBgm}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              isPlayingTestBgm
                ? 'border border-violet-400 bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isPlayingTestBgm ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlayingTestBgm ? 'Dừng phát nhạc' : 'Nghe thử nhạc'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Combobox chọn bài nhạc */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Danh sách bài nhạc nền có sẵn:
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => handleSelectTrack(e.target.value)}
              className="field w-full text-xs font-medium bg-slate-900 border-white/15 text-amber-100 py-2"
            >
              {PRESET_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {PRESET_TRACKS.find((t) => t.id === selectedTrackId)?.description}
            </p>
          </div>

          {/* Nút tải file nhạc trực tiếp từ máy tính */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3.5 py-2 font-bold text-amber-200 transition hover:border-amber-300 hover:bg-amber-500/30"
            >
              <Upload size={14} />
              <span>Tải file nhạc từ máy tính (.mp3, .wav)</span>
            </button>
            {uploadedFileName && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <FileAudio size={14} />
                <span className="font-semibold">Đang nạp file:</span>
                <span className="underline truncate max-w-xs">{uploadedFileName}</span>
              </div>
            )}
          </div>

          {/* Ô nhập link tùy chỉnh nếu chọn Tùy chỉnh */}
          {selectedTrackId === 'custom-input' && (
            <div className="space-y-1">
              <label className="block font-medium text-slate-300">
                Hoặc nhập đường dẫn / URL file nhạc:
              </label>
              <input
                type="text"
                value={customBgmUrl}
                onChange={(e) => handleCustomUrlChange(e.target.value)}
                placeholder="/audio/ten-file.mp3 hoặc https://..."
                className="field w-full text-xs font-mono"
              />
            </div>
          )}
        </div>
      </section>

      {/* Hướng dẫn chi tiết: Lấy nhạc ở đâu? */}
      <section className="card p-6 border-amber-500/25 bg-[#171109]/90 text-amber-100">
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
          <HelpCircle size={18} className="text-amber-400" />
          <h3 className="font-bold text-sm text-amber-200 font-serif">
            Lấy file nhạc nền Phật giáo ở đâu?
          </h3>
        </div>

        <div className="mt-3 space-y-3 text-xs leading-relaxed text-amber-200/80">
          <p>
            Bạn có thể dễ dàng tải các bản nhạc tụng kinh hoặc nhạc thiền hay nhất qua các nguồn sau:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
              <div className="font-bold text-amber-300 mb-1">1. Nhạc Tụng Kinh & Niệm Phật (MP3)</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                <li>
                  <strong>Nam Mô A Di Đà Phật</strong> (Thầy Thích Trí Thoát tụng kinh hoặc nhạc niệm Phật du dương).
                </li>
                <li>
                  <strong>Chú Đại Bi</strong> (phiên bản tiếng Phạn hoặc tiếng Việt êm dịu).
                </li>
                <li>
                  Có thể tìm và tải MP3 miễn phí từ <em>Phatam.com</em>, <em>Chiasenhac</em> hoặc YouTube.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
              <div className="font-bold text-amber-300 mb-1">2. Nhạc Thiền Không Bản Quyền (Royalty-Free)</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                <li>
                  <strong>YouTube Audio Library</strong>: Tìm từ khóa <em>"Meditation"</em>, <em>"Zen"</em>, <em>"Temple"</em>.
                </li>
                <li>
                  <strong>Pixabay Music</strong>: Rất nhiều bản nhạc sáo trúc, chuông xoay Tây Tạng miễn phí 100%.
                </li>
                <li>
                  <strong>Archive.org</strong>: Kho tàng tụng kinh truyền thống các chùa.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-400/30 p-2.5 text-[11px] text-amber-100">
            👉 <strong>Cách sử dụng:</strong> Sau khi tải file <code>.mp3</code> hoặc <code>.wav</code> về máy tính:
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              <li>
                <strong>Cách 1 (Nhanh nhất):</strong> Bấm nút <code>[Tải file nhạc từ máy tính]</code> ở trên, chọn file và hệ thống sẽ phát ngay lập tức.
              </li>
              <li>
                <strong>Cách 2 (Cố định):</strong> Copy file vào thư mục dự án <code>apps/web/public/audio/</code> (ví dụ: đổi tên thành <code>bgm.mp3</code> hoặc <code>bgm.wav</code>).
              </li>
            </ol>
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
