import { useMemo, useState } from 'react';
import {
  Heart,
  Gift,
  MessageCircle,
  UserPlus,
  Share2,
  Users,
  Pause,
  Play,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import { eventMatches, templeActionFor, type LiveEventType } from '@live/shared';
import { useMonitorStore } from '../../stores/useMonitorStore';
import { command } from '../../services/socket';
const meta = {
  LIKE: [Heart, 'Thích', 'text-pink-400'],
  COMMENT: [MessageCircle, 'Bình luận', 'text-sky-400'],
  GIFT: [Gift, 'Quà tặng', 'text-violet-400'],
  FOLLOW: [UserPlus, 'Theo dõi', 'text-emerald-400'],
  SHARE: [Share2, 'Chia sẻ', 'text-orange-400'],
  JOIN: [Users, 'Tham gia', 'text-cyan-400'],
} as const;
export function EventTable() {
  const events = useMonitorStore((s) => s.events),
    prefs = useMonitorStore((s) => s.prefs);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | LiveEventType>('ALL');
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState<typeof events>([]);
  const list = useMemo(() => {
    const base = paused ? visible : events;
    if (!paused && visible !== events) setTimeout(() => setVisible(events), 0);
    return base.filter((e) => eventMatches(e, search, type, prefs.display));
  }, [events, paused, visible, search, type, prefs.display]);
  const detail = (e: (typeof events)[number]) =>
    e.type === 'LIKE'
      ? `${e.likeCount ?? 1} lượt thích`
      : e.type === 'COMMENT'
        ? e.comment
        : e.type === 'GIFT'
          ? `${e.gift?.name} × ${e.gift?.quantity}`
          : meta[e.type][1];
  return (
    <section className="card min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold">Sự kiện trực tiếp</h2>
          <p className="mt-1 text-xs text-slate-400">{list.length} sự kiện đang hiển thị</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input
              className="field py-2 pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm người dùng..."
            />
          </div>
          <select
            className="field w-auto py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="ALL">Mọi loại</option>
            {Object.entries(meta).map(([v, m]) => (
              <option value={v} key={v}>
                {m[1]}
              </option>
            ))}
          </select>
          <button
            className="btn bg-white/5 px-3 py-2 text-sm"
            onClick={() => {
              setVisible(events);
              setPaused(!paused);
            }}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />} {paused ? 'Tiếp tục' : 'Tạm dừng'}
          </button>
          <button
            className="btn bg-red-500/10 px-3 py-2 text-red-300"
            onClick={() => command('stats:reset', {})}
            title="Xóa toàn bộ lịch sử đã lưu"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="scrollbar max-h-[510px] overflow-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#101425] text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Thời gian</th>
              <th className="p-4">Tài khoản nền tảng</th>
              <th className="p-4">Biệt danh</th>
              <th className="p-4">Loại</th>
              <th className="p-4">Chi tiết</th>
              <th className="p-4">Nguồn</th>
              <th className="p-4">Hành động game</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {list.map((e) => {
              const [Icon, label, color] = meta[e.type];
              const action = templeActionFor(e);
              return (
                <tr key={e.id} className="transition hover:bg-white/[.025]">
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {new Date(e.timestamp).toLocaleTimeString('vi-VN')}
                  </td>
                  <td className="p-4 font-medium">@{e.user.username}</td>
                  <td className="p-4 text-slate-300">{e.user.nickname}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 ${color}`}>
                      <Icon size={15} />
                      {label}
                    </span>
                  </td>
                  <td className="max-w-[240px] truncate p-4 text-slate-400" title={detail(e)}>
                    {detail(e)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        e.source === 'SIMULATOR'
                          ? 'bg-violet-500/10 text-violet-300'
                          : e.source === 'YOUTUBE'
                            ? 'bg-red-500/10 text-red-300'
                            : e.source === 'FACEBOOK'
                              ? 'bg-blue-500/10 text-blue-300'
                              : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {e.source === 'SIMULATOR' ? 'MÔ PHỎNG' : e.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-200">
                      <Sparkles size={13} />
                      {action}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  Chưa có sự kiện. Hãy thử bảng giả lập bên cạnh.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
