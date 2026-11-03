import { Gift, Sparkles } from 'lucide-react';
import { useTempleGameStore } from '../useTempleGameStore';

export function RecentDonorsList({ mobile = false }: { mobile?: boolean }) {
  const storedDonors = useTempleGameStore((state) => state.recentDonors) || [];
  // Server chỉ gửi người thật của phiên hiện tại; danh sách này không đọc từ SQLite.
  const recentDonors = storedDonors;

  if (recentDonors.length === 0) return null;

  // Xếp hạng các thí chủ cúng dường trong phiên live
  // Gom theo userId, tính tổng số lượng lễ vật đã cúng dường trong phiên
  const donorMap = new Map<
    string,
    {
      userId: string;
      nickname: string;
      avatarUrl?: string;
      giftName: string;
      totalQuantity: number;
      lastTimestamp: number;
    }
  >();

  for (const donor of recentDonors) {
    const existing = donorMap.get(donor.userId);
    if (!existing) {
      donorMap.set(donor.userId, {
        userId: donor.userId,
        nickname: donor.nickname,
        avatarUrl: donor.avatarUrl,
        giftName: donor.giftName || 'Hoa cúng Phật',
        totalQuantity: donor.quantity || 1,
        lastTimestamp: donor.timestamp,
      });
    } else {
      existing.totalQuantity += donor.quantity || 1;
      existing.lastTimestamp = Math.max(existing.lastTimestamp, donor.timestamp);
      if (donor.giftName) existing.giftName = donor.giftName;
      if (donor.avatarUrl) existing.avatarUrl = donor.avatarUrl;
    }
  }

  const sessionDonors = Array.from(donorMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity || b.lastTimestamp - a.lastTimestamp)
    .slice(0, 5);

  if (sessionDonors.length === 0) return null;

  return (
    <div
      className={`pointer-events-none flex flex-col gap-2 z-30 ${
        mobile ? 'w-44 text-[11px]' : 'w-56 text-xs'
      }`}
    >
      <div className="flex items-center gap-1.5 px-1 text-amber-300 font-bold tracking-wide uppercase text-[10px] drop-shadow-md">
        <Sparkles size={12} className="text-amber-400 animate-pulse" />
        <span>Cúng dường phiên live</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {sessionDonors.map((donor, idx) => (
          <div
            key={`${donor.userId}-${donor.lastTimestamp}-${idx}`}
            className="flex items-center gap-2 py-0.5 px-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] transition-all duration-300 animate-in fade-in slide-in-from-left-3"
          >
            {/* Avatar tròn viền vàng */}
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400/80 bg-amber-950/80 shadow-md shadow-amber-500/20">
                {donor.avatarUrl ? (
                  <img
                    src={donor.avatarUrl}
                    alt={donor.nickname}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-bold text-amber-200 text-xs">
                    {donor.nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-slate-950 font-black shadow">
                {idx + 1}
              </div>
            </div>

            {/* Thông tin người tặng & món quà */}
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-amber-100 leading-tight">
                {donor.nickname}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-medium">
                <Gift size={10} className="text-amber-400 shrink-0" />
                <span className="truncate">{donor.giftName || 'Hoa cúng Phật'}</span>
                {donor.totalQuantity > 1 && (
                  <span className="font-bold text-amber-400 font-mono">x{donor.totalQuantity}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
