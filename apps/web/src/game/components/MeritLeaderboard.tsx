import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTempleGameStore } from '../useTempleGameStore';

export function MeritLeaderboard({
  mobile = false,
  hideSimulated = false,
}: {
  mobile?: boolean;
  hideSimulated?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const characterList = useTempleGameStore((s) => s.characterList);
  const syncCharacters = useTempleGameStore((s) => s.syncCharacters);

  // Nạp danh sách nhân vật thực tế từ SQLite database khi component mount
  useEffect(() => {
    fetch('/api/characters')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.ok && Array.isArray(res.data)) {
          syncCharacters(res.data);
        }
      })
      .catch(() => {
        // Có thể server chạy khác port hoặc môi trường dev
      });
  }, [syncCharacters]);

  // Lọc và lấy Top 5 người có điểm công đức cao nhất từ Database SQLite thật
  const topDonors = characterList
    .filter((char) => {
      if (char.meritPoints <= 0) return false;
      if (hideSimulated && (char.userId.startsWith('sim-') || char.username?.startsWith('sim_'))) {
        return false;
      }
      return true;
    })
    .slice(0, 5)
    .map((char) => ({
      userId: char.userId,
      nickname: char.nickname || char.username || 'Thí chủ',
      score: char.meritPoints,
      avatarUrl: char.avatarUrl,
      title: char.rankName ?? 'Khách hành hương',
    }));

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

      {/* Danh sách top công đức thật từ Database */}
      {!collapsed && (
        <div className="p-2.5">
          {topDonors.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-amber-300/60 font-serif italic">
              Chưa có thí chủ công đức
            </div>
          ) : (
            <ol className="divide-y divide-amber-900/40 space-y-1.5">
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
        </div>
      )}
    </aside>
  );
}
