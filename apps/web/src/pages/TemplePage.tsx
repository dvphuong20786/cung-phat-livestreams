import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TempleScene, type CameraPreset, type TempleTheme } from '../game/TempleScene';
import { TempleToolbar } from '../game/TempleToolbar';
import { useTempleGameStore } from '../game/useTempleGameStore';
import { useMonitorStore } from '../stores/useMonitorStore';
export function TemplePage({
  overlay = false,
  mobile = false,
}: {
  overlay?: boolean;
  mobile?: boolean;
}) {
  const [preset, setPreset] = useState<CameraPreset>('OVERVIEW'),
    [theme, setTheme] = useState<TempleTheme>(overlay ? 'INTERIOR' : 'COURTYARD'),
    [isOverlayToolbarVisible, setIsOverlayToolbarVisible] = useState(true);
  const { active, queue, latest } = useTempleGameStore();
  const connection = useMonitorStore((s) => s.connection);
  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-slate-950"
      style={
        mobile
          ? {
              backgroundImage: "url('/assets/temple-interior-mobile-backdrop.png')",
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%',
            }
          : undefined
      }
    >
      <TempleScene preset={preset} theme={theme} controls={!overlay} mobile={mobile} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      {overlay && isOverlayToolbarVisible && (
        <div
          className={
            mobile
              ? 'absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-center gap-2'
              : 'absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2'
          }
        >
          <TempleToolbar
            preset={preset}
            setPreset={setPreset}
            theme={theme}
            setTheme={setTheme}
            compact
          />
          <button
            type="button"
            className="btn border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-xl"
            onClick={() => setIsOverlayToolbarVisible(false)}
            title="Ẩn thanh điều khiển"
          >
            <EyeOff size={15} /> Ẩn
          </button>
        </div>
      )}
      {overlay && !isOverlayToolbarVisible && (
        <button
          type="button"
          className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-slate-950/55 p-2 text-slate-300 opacity-35 shadow-lg backdrop-blur transition hover:opacity-100"
          onClick={() => setIsOverlayToolbarVisible(true)}
          title="Hiện thanh điều khiển"
          aria-label="Hiện thanh điều khiển overlay"
        >
          <Eye size={16} />
        </button>
      )}
      {!overlay && (
        <>
          <div className="absolute left-4 top-4 max-w-sm rounded-2xl border border-amber-100/20 bg-[#25170d]/70 p-4 shadow-2xl backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[.25em] text-amber-200/70">
              Chùa An Lạc · {theme === 'INTERIOR' ? 'Nội điện' : 'Ngoại cảnh'}
            </div>
            <div className="mt-1 font-serif text-xl text-amber-50">
              Không gian lễ Phật trực tuyến
            </div>
            {latest && <div className="mt-3 text-sm text-amber-100">{latest}</div>}
          </div>
          <div className="absolute right-4 top-4 rounded-2xl border border-white/15 bg-slate-950/70 p-3 text-xs backdrop-blur">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${connection.state === 'CONNECTED' ? 'bg-emerald-400' : 'bg-slate-500'}`}
              />
              {connection.state === 'CONNECTED' ? 'TikTok LIVE đã kết nối' : 'Chế độ mô phỏng'}
            </div>
            <div className="mt-2 text-slate-300">
              Đang hoạt động: <b>{active.length}</b> · Chờ: <b>{queue.length}</b>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <TempleToolbar
              preset={preset}
              setPreset={setPreset}
              theme={theme}
              setTheme={setTheme}
            />
          </div>
        </>
      )}
    </div>
  );
}
