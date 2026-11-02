import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Bell,
  Play,
  Pause,
  Disc3,
  Upload,
  HelpCircle,
  FileAudio,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { templeAudio } from '../../game/services/TempleAudioService';

interface FolderAudioFile {
  name: string;
  url: string;
  size: number;
}

export function AudioSettingsPanel() {
  const [isMuted, setIsMuted] = useState(() => templeAudio.getMuted());
  const [volume, setVolume] = useState(() => templeAudio.getVolume());
  const [isPlayingTestBgm, setIsPlayingTestBgm] = useState(false);

  const [folderFiles, setFolderFiles] = useState<FolderAudioFile[]>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const [currentUrl, setCurrentUrl] = useState(() => templeAudio.getCurrentBgmUrl());
  const [customBgmUrl, setCustomBgmUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quét danh sách file từ API backend hoặc Vite server
  const fetchAudioFiles = useCallback(async () => {
    setIsLoadingFolder(true);
    try {
      const res = await fetch('/api/audio-files');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.files)) {
          setFolderFiles(data.files);
        }
      }
    } catch (err) {
      console.warn('Không thể tải danh sách file audio:', err);
    } finally {
      setIsLoadingFolder(false);
    }
  }, []);

  useEffect(() => {
    fetchAudioFiles();
  }, [fetchAudioFiles]);

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

  const handleSelectTrack = (url: string) => {
    if (url === 'custom') {
      setCurrentUrl('custom');
      if (customBgmUrl.trim()) {
        templeAudio.setBgmTrack(customBgmUrl.trim());
        if (isPlayingTestBgm) templeAudio.startBgm();
      }
      return;
    }

    setCurrentUrl(url);
    templeAudio.setBgmTrack(url);
    if (isPlayingTestBgm) {
      templeAudio.startBgm();
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomBgmUrl(url);
    if (url.trim()) {
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
    setCurrentUrl(objectUrl);
    templeAudio.setBgmTrack(objectUrl);

    if (isMuted) {
      templeAudio.setMuted(false);
      setIsMuted(false);
    }
    templeAudio.startBgm();
    setIsPlayingTestBgm(true);
  };

  // Chủ động gõ các âm thanh nghi lễ
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

  // Kiểm tra xem currentUrl có nằm trong danh sách folderFiles hay không
  const isKnownTrack =
    currentUrl === 'synth' ||
    currentUrl === 'custom' ||
    folderFiles.some((f) => f.url === currentUrl);

  const selectedValue = isKnownTrack ? currentUrl : 'custom';

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
          {/* Combobox chọn bài nhạc từ thư mục */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <FolderOpen size={14} className="text-amber-400" />
                <span>Danh sách file nhạc trong thư mục apps/web/public/audio:</span>
              </label>
              <button
                type="button"
                onClick={fetchAudioFiles}
                disabled={isLoadingFolder}
                className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition"
                title="Bấm để quét lại các file vừa copy vào thư mục"
              >
                <RefreshCw size={12} className={isLoadingFolder ? 'animate-spin' : ''} />
                <span>Làm mới danh sách</span>
              </button>
            </div>

            <select
              value={selectedValue}
              onChange={(e) => handleSelectTrack(e.target.value)}
              className="field w-full text-xs font-medium bg-slate-900 border-white/15 text-amber-100 py-2.5"
            >
              <optgroup label="🎵 File nhạc trong thư mục apps/web/public/audio/">
                {folderFiles.length === 0 ? (
                  <option disabled value="">
                    (Thư mục public/audio đang trống, hãy copy file vào đây)
                  </option>
                ) : (
                  folderFiles.map((file) => (
                    <option key={file.url} value={file.url}>
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </option>
                  ))
                )}
              </optgroup>

              <optgroup label="✨ Âm thanh tự sinh & Tùy chọn khác">
                <option value="synth">
                  Nhạc thiền Singing Bowl (Tự sinh trực tiếp qua Web Audio)
                </option>
                <option value="custom">Đường dẫn file nhạc tùy chỉnh / URL khác</option>
              </optgroup>
            </select>

            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                📁 Đã tìm thấy: <strong className="text-amber-300">{folderFiles.length}</strong> file
                trong thư mục <code>apps/web/public/audio/</code>
              </span>
              {currentUrl && currentUrl !== 'synth' && currentUrl !== 'custom' && (
                <span className="text-emerald-400 truncate max-w-xs font-mono">
                  Đang chọn: {decodeURIComponent(currentUrl.replace('/audio/', ''))}
                </span>
              )}
            </div>
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
          {selectedValue === 'custom' && (
            <div className="space-y-1">
              <label className="block font-medium text-slate-300">
                Hoặc nhập đường dẫn / URL file nhạc:
              </label>
              <input
                type="text"
                value={customBgmUrl || (currentUrl !== 'custom' ? currentUrl : '')}
                onChange={(e) => handleCustomUrlChange(e.target.value)}
                placeholder="/audio/ten-file.mp3 hoặc https://..."
                className="field w-full text-xs font-mono"
              />
            </div>
          )}
        </div>
      </section>

      {/* Khối thử nghiệm tiếng Chuông & Mõ SFX - CHỦ ĐỘNG GÕ BẰNG TAY */}
      <section className="card p-6 border-white/10 bg-[#0d111e]/90 text-slate-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Âm thanh nghi lễ Phật giáo (SFX) - Chủ động gõ
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5 font-medium">
            ✓ Đã tắt tự động kêu
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          Các âm thanh nghi lễ này <strong>không tự động kêu</strong> trong livestream để giữ chánh
          điện thanh tịnh. Chỉ khi nào Admin bấm các nút bên dưới (hoặc trên thanh công cụ chánh
          điện) thì mới phát ra tiếng.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* Nút chủ động gõ mõ */}
          <button
            type="button"
            onClick={handleTestWoodenFish}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40 active:scale-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-900/50 text-xl text-amber-300 shadow-md transition group-hover:scale-110">
              🪵
            </div>
            <div>
              <div className="font-bold text-xs text-amber-200">Tiếng Gõ Mõ</div>
              <div className="text-[10px] text-slate-400">Âm sắc mộc 540Hz thanh tịnh</div>
            </div>
            <span className="rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1 font-bold text-[11px] text-amber-200 group-hover:bg-amber-500/30">
              🪵 Bấm Gõ Mõ
            </span>
          </button>

          {/* Nút chủ động đánh chuông đại hồng chung */}
          <button
            type="button"
            onClick={handleTestBell}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40 active:scale-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-900/50 text-xl text-amber-300 shadow-md transition group-hover:scale-110">
              🔔
            </div>
            <div>
              <div className="font-bold text-xs text-amber-200">Đại Hồng Chung</div>
              <div className="text-[10px] text-slate-400">Chuông chùa ngân vang 5.5s</div>
            </div>
            <span className="rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1 font-bold text-[11px] text-amber-200 group-hover:bg-amber-500/30">
              🔔 Bấm Đánh Chuông
            </span>
          </button>

          {/* Nút chủ động đánh tiếng khánh dâng hoa */}
          <button
            type="button"
            onClick={handleTestChime}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-center transition hover:border-amber-400 hover:bg-amber-950/40 active:scale-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-900/50 text-xl text-amber-300 shadow-md transition group-hover:scale-110">
              ✨
            </div>
            <div>
              <div className="font-bold text-xs text-amber-200">Tiếng Khánh Dâng Hoa</div>
              <div className="text-[10px] text-slate-400">Ngân nga trong trẻo khi cúng dường</div>
            </div>
            <span className="rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1 font-bold text-[11px] text-amber-200 group-hover:bg-amber-500/30">
              ✨ Bấm Đánh Khánh
            </span>
          </button>
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
                <strong>Cách 1 (Tốt nhất):</strong> Copy file vào thư mục dự án <code>apps/web/public/audio/</code>, sau đó bấm nút <strong>"Làm mới danh sách"</strong> ở trên, tên file sẽ tự động xuất hiện trong danh sách chọn.
              </li>
              <li>
                <strong>Cách 2 (Nhanh tức thì):</strong> Bấm nút <code>[Tải file nhạc từ máy tính]</code> ở trên, chọn file và hệ thống sẽ phát ngay lập tức.
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
