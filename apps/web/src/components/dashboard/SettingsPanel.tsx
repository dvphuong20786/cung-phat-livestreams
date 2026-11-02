import { Settings, RotateCcw, Music, MessageSquare, Users } from 'lucide-react';
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
        {/* Cài đặt thời gian giữ bình luận trên đầu nhân vật (2D & 3D) */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare size={15} className="text-amber-400" />
              Thời gian giữ bình luận (2D & 3D):
            </span>
            <span className="font-bold text-amber-300">
              {prefs.commentDurationSeconds ?? 20} giây
            </span>
          </div>
          <input
            className="w-full accent-amber-500"
            type="range"
            min="5"
            max="120"
            step="5"
            value={prefs.commentDurationSeconds ?? 20}
            onChange={(e) => setPrefs({ commentDurationSeconds: +e.target.value })}
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>5s</span>
            <div className="flex gap-1.5">
              {[10, 15, 20, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                    (prefs.commentDurationSeconds ?? 20) === sec
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                  onClick={() => setPrefs({ commentDurationSeconds: sec })}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <span>120s</span>
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Users size={15} className="text-cyan-400" />
              Hàng chờ Nội điện 2D
            </span>
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={prefs.mobile2dQueueEnabled ?? true}
              onChange={(event) => setPrefs({ mobile2dQueueEnabled: event.target.checked })}
            />
          </label>
          <p className="text-xs leading-5 text-slate-400">
            Áp dụng cho cả overlay 2D ngang và Mobile 2D. Khi quá 24 khách, người mới đứng chờ ở mép dưới và vào theo mức ưu tiên khi có ghế trống.
          </p>
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-slate-400">
              <span>Thời gian ngồi tối đa khi đông</span>
              <strong className="text-cyan-300">
                {prefs.mobile2dBusySeatSeconds ?? 20} giây
              </strong>
            </span>
            <input
              className="w-full accent-cyan-500"
              type="range"
              min="10"
              max="120"
              step="5"
              disabled={!(prefs.mobile2dQueueEnabled ?? true)}
              value={prefs.mobile2dBusySeatSeconds ?? 20}
              onChange={(event) => setPrefs({ mobile2dBusySeatSeconds: +event.target.value })}
            />
          </label>
          <div className="border-t border-cyan-500/15 pt-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
              Thời gian hoạt cảnh 2D
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Khách thường đứng lễ', 'mobile2dPrayerSeconds', 3],
                ['Tặng quà quỳ lễ', 'mobile2dDonationBowSeconds', 5],
                ['Dâng hoa', 'mobile2dFlowerOfferingSeconds', 3.5],
                ['Đi vào', 'mobile2dWalkInSeconds', 2.6],
                ['Đi về ghế', 'mobile2dWalkToSeatSeconds', 2.4],
              ].map(([label, key, fallback]) => (
                <label key={String(key)} className="rounded-lg bg-black/15 p-2 text-slate-400">
                  <span className="mb-1 block">{label}</span>
                  <span className="flex items-center gap-1">
                    <input
                      className="field min-w-0 flex-1 px-2 py-1 text-sm"
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.1"
                      value={Number(prefs[key as keyof typeof prefs] ?? fallback)}
                      onChange={(event) =>
                        setPrefs({ [key]: Math.max(0.5, +event.target.value) })
                      }
                    />
                    <span>giây</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
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
