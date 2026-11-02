import { Settings, RotateCcw, Music } from 'lucide-react';
import { useMonitorStore } from '../../stores/useMonitorStore';
import { command } from '../../services/socket';

export function SettingsPanel() {
  const { prefs, setPrefs } = useMonitorStore();
  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Settings size={19} className="text-slate-400" />
          <h2 className="font-bold">Cài đặt hệ thống</h2>
        </div>
        <a
          href="/admin/audio"
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
        >
          <Music size={13} />
          Cài đặt Nhạc & Chuông Mõ →
        </a>
      </div>
      <div className="space-y-3 text-sm">
        {[
          ['Tự động kết nối lại', 'autoReconnect'],
          ['Hiện sự kiện tham gia', 'joinEvents'],
          ['Ghi log gỡ lỗi', 'debug'],
        ].map(([label, key]) => (
          <label className="flex cursor-pointer items-center justify-between" key={key}>
            <span className="text-slate-300">{label}</span>
            <input
              type="checkbox"
              className="accent-violet-500"
              checked={prefs[key as keyof typeof prefs] as boolean}
              onChange={(e) => setPrefs({ [key]: e.target.checked })}
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-slate-400">Nguồn hiển thị</span>
          <select
            className="field text-sm"
            value={prefs.display}
            onChange={(e) => setPrefs({ display: e.target.value as any })}
          >
            <option value="ALL">Tất cả</option>
            <option value="TIKTOK">Chỉ sự kiện thật</option>
            <option value="SIMULATOR">Chỉ mô phỏng</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-slate-400">Số log tối đa: {prefs.maxEvents}</span>
          <input
            className="w-full accent-violet-500"
            type="range"
            min="100"
            max="500"
            step="50"
            value={prefs.maxEvents}
            onChange={(e) => setPrefs({ maxEvents: +e.target.value })}
          />
        </label>
        <button
          className="btn w-full bg-white/5 text-slate-300"
          onClick={() => command('stats:reset', { source: 'SIMULATOR' })}
        >
          <RotateCcw size={15} /> Đặt lại thống kê mô phỏng
        </button>
      </div>
    </section>
  );
}
