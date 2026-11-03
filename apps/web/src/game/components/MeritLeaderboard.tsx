import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTempleGameStore } from '../useTempleGameStore';

export function MeritLeaderboard({ mobile = false }: { mobile?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const sessionMeritEntries = useTempleGameStore((state) => state.sessionMeritEntries);

  // Danh sách phiên nằm trong RAM server, không đọc lịch sử nhân vật từ SQLite.
  const topDonors = sessionMeritEntries.slice(0, 5).map((entry) => ({
    userId: entry.userId,
    nickname: entry.nickname || 'Thí chủ',
    score: entry.meritPoints,
    avatarUrl: entry.avatarUrl,
    title: entry.rankName ?? 'Khách hành hương',
  }));

  return (
    <aside
      className={`pointer-events-auto rounded-2xl border border-amber-500/35 bg-[#1c110a]/92 text-amber-50 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 ${
        mobile ? 'w-[210px] text-xs' : 'w-[270px] text-sm'
      }`}
      aria-label="Bảng Công Đức"
    >
      {/* Header */}
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-amber-500/25 px-3.5 py-2.5 text-center"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Mở rộng bảng công đức' : 'Thu gọn'}
      >
        <span className="w-4" />
        <h2 className="font-serif text-base font-bold tracking-widest text-amber-300">
          ✦ Công Đức ✦
        </h2>
        <button
          type="button"
          className="text-amber-400/70 hover:text-amber-200"
          aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Danh sách người thật của phiên hiện tại, chỉ lưu trong RAM */}
      {!collapsed && (
        <div className="p-3">
          {topDonors.length === 0 ? (
            <div className="py-3 text-center text-xs text-amber-300/60 font-serif italic">
              Chưa có thí chủ công đức
            </div>
          ) : (
            <ol className="divide-y divide-amber-900/40 space-y-2">
              {topDonors.map((donor, idx) => (
                <li
                  key={donor.userId}
                  className="flex items-center justify-between gap-2 pt-1.5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-serif font-bold text-amber-400 text-sm shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-amber-100 text-xs sm:text-[13px] leading-tight">
                        {donor.nickname}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-amber-400/75 leading-tight mt-0.5">
                        {donor.title}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-serif font-bold text-amber-300 text-sm">
                    {donor.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
