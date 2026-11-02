import { useMemo, useState } from 'react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useMonitorStore } from '../../stores/useMonitorStore';

interface Donor {
  userId: string;
  nickname: string;
  score: number;
  avatarUrl?: string;
  title: string;
}

const seedDonors: Donor[] = [
  { userId: 'seed-1', nickname: 'nhi', score: 597, title: 'Đại Hộ Pháp' },
  { userId: 'seed-2', nickname: 'Minh An', score: 199, title: 'Hộ Pháp' },
  { userId: 'seed-3', nickname: 'Chùa Sen Online', score: 182, title: 'Hộ Pháp' },
  { userId: 'seed-4', nickname: 'ĐẶNG VĂN THA...', score: 31, title: 'Thí Chủ' },
  { userId: 'seed-5', nickname: 'Thế Dũng', score: 30, title: 'Thí Chủ' },
];

function getTitle(score: number): string {
  if (score >= 500) return 'Đại Hộ Pháp';
  if (score >= 100) return 'Hộ Pháp';
  return 'Thí Chủ';
}

export function MeritLeaderboard({
  mobile = false,
  hideSimulated = false,
}: {
  mobile?: boolean;
  hideSimulated?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const events = useMonitorStore((s) => s.events);

  const topDonors = useMemo(() => {
    const scores = new Map<string, { nickname: string; score: number; avatarUrl?: string }>();

    // Khởi tạo điểm công đức mẫu ban đầu (nếu không phải hideSimulated)
    if (!hideSimulated) {
      for (const seed of seedDonors) {
        scores.set(seed.userId, {
          nickname: seed.nickname,
          score: seed.score,
          avatarUrl: seed.avatarUrl,
        });
      }
    }

    // Cộng dồn quà tặng từ sự kiện realtime
    for (const e of events) {
      if (hideSimulated && e.source === 'SIMULATOR') continue;
      if (e.type === 'GIFT' && e.gift) {
        const id = e.user.id || e.user.username;
        const pts = (e.gift.quantity ?? 1) * (e.gift.repeatEnd ? 1 : 1);
        const current = scores.get(id);
        if (current) {
          current.score += pts;
          current.nickname = e.user.nickname || current.nickname;
          current.avatarUrl = e.user.avatarUrl || current.avatarUrl;
        } else {
          scores.set(id, {
            nickname: e.user.nickname || e.user.username,
            score: pts,
            avatarUrl: e.user.avatarUrl,
          });
        }
      }
    }

    return Array.from(scores.entries())
      .map(([userId, item]) => ({
        userId,
        nickname: item.nickname,
        score: item.score,
        avatarUrl: item.avatarUrl,
        title: getTitle(item.score),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [events]);

  return (
    <aside
      className={`pointer-events-auto rounded-2xl border border-amber-500/35 bg-[#1c110a]/92 text-amber-50 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 ${
        mobile ? 'w-44 text-[11px]' : 'w-56 text-xs'
      }`}
      aria-label="Bảng Công Đức"
    >
      {/* Header */}
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-amber-500/25 px-3 py-2 text-center"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Mở rộng bảng công đức' : 'Thu gọn'}
      >
        <span className="w-4" />
        <h2 className="font-serif text-sm font-bold tracking-widest text-amber-300">
          ✦ Công Đức ✦
        </h2>
        <button
          type="button"
          className="text-amber-400/70 hover:text-amber-200"
          aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Danh sách top donate */}
      {!collapsed && (
        <ol className="divide-y divide-amber-900/40 p-2.5 space-y-1.5">
          {topDonors.map((donor, idx) => (
            <li
              key={donor.userId}
              className="flex items-center justify-between gap-1.5 pt-1 text-left"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="font-serif font-bold text-amber-400/90 text-xs shrink-0">
                  {idx + 1}.
                </span>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-amber-100 text-[11px] leading-tight">
                    {donor.nickname}
                  </div>
                  <div className="text-[9px] font-medium text-amber-400/70 leading-none">
                    {donor.title}
                  </div>
                </div>
              </div>
              <span className="shrink-0 font-serif font-bold text-amber-300 text-xs">
                {donor.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

