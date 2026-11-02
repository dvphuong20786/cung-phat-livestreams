import type { TempleGameAction } from '@live/shared';

export interface CultivationRank {
  rankIndex: number;
  minLevel: number;
  maxLevel: number;
  minPoints: number;
  maxPoints: number;
  nameMale: string;
  nameFemale: string;
  badgeColor: string;
  haloColor?: string;
}

export const CULTIVATION_RANKS: CultivationRank[] = [
  {
    rankIndex: 6,
    minLevel: 81,
    maxLevel: 100,
    minPoints: 12000,
    maxPoints: 25000,
    nameMale: 'Trụ trì',
    nameFemale: 'Trụ trì',
    badgeColor: 'from-amber-400 via-yellow-300 to-amber-500',
    haloColor: '#ffd700',
  },
  {
    rankIndex: 5,
    minLevel: 61,
    maxLevel: 80,
    minPoints: 6000,
    maxPoints: 11999,
    nameMale: 'Tỳ kheo',
    nameFemale: 'Tỳ kheo ni',
    badgeColor: 'from-amber-500 to-orange-500',
    haloColor: '#f59e0b',
  },
  {
    rankIndex: 4,
    minLevel: 41,
    maxLevel: 60,
    minPoints: 2500,
    maxPoints: 5999,
    nameMale: 'Sa di',
    nameFemale: 'Sa di ni',
    badgeColor: 'from-yellow-600 to-amber-700',
  },
  {
    rankIndex: 3,
    minLevel: 26,
    maxLevel: 40,
    minPoints: 1000,
    maxPoints: 2499,
    nameMale: 'Cư sĩ',
    nameFemale: 'Cư sĩ',
    badgeColor: 'from-amber-700 to-stone-700',
  },
  {
    rankIndex: 2,
    minLevel: 11,
    maxLevel: 25,
    minPoints: 200,
    maxPoints: 999,
    nameMale: 'Phật tử',
    nameFemale: 'Phật tử',
    badgeColor: 'from-indigo-500 to-purple-600',
  },
  {
    rankIndex: 1,
    minLevel: 1,
    maxLevel: 10,
    minPoints: 0,
    maxPoints: 199,
    nameMale: 'Khách hành hương',
    nameFemale: 'Khách hành hương',
    badgeColor: 'from-slate-500 to-slate-700',
  },
];

export interface LevelMilestone {
  level: number;
  points: number;
  unlockTitle: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, points: 0, unlockTitle: 'Nhận nhân vật Khách hành hương' },
  { level: 5, points: 60, unlockTitle: 'Mở động tác chắp tay' },
  { level: 10, points: 180, unlockTitle: 'Mở hiệu ứng chuẩn bị thăng cấp' },
  { level: 11, points: 200, unlockTitle: 'Thăng cấp thành Phật tử' },
  { level: 15, points: 400, unlockTitle: 'Mở động tác quỳ lễ' },
  { level: 20, points: 650, unlockTitle: 'Nhận tràng hạt' },
  { level: 25, points: 950, unlockTitle: 'Mở hiệu ứng chuyển thành Cư sĩ' },
  { level: 26, points: 1000, unlockTitle: 'Thăng cấp thành Cư sĩ' },
  { level: 30, points: 1400, unlockTitle: 'Đổi trang phục nâu' },
  { level: 35, points: 1900, unlockTitle: 'Mở động tác tụng kinh' },
  { level: 40, points: 2400, unlockTitle: 'Mở nghi thức xuất gia' },
  { level: 41, points: 2500, unlockTitle: 'Thăng cấp thành Sa di/Sa di ni' },
  { level: 50, points: 4000, unlockTitle: 'Mở động tác thiền' },
  { level: 60, points: 5900, unlockTitle: 'Mở hiệu ứng thọ giới' },
  { level: 61, points: 6000, unlockTitle: 'Thăng cấp thành Tỳ kheo/Tỳ kheo ni' },
  { level: 70, points: 8500, unlockTitle: 'Mở pháp phục nâng cao' },
  { level: 80, points: 11800, unlockTitle: 'Mở thử thách Trụ trì' },
  { level: 81, points: 12000, unlockTitle: 'Thăng cấp thành Trụ trì' },
  { level: 90, points: 17000, unlockTitle: 'Mở hào quang' },
  { level: 100, points: 25000, unlockTitle: 'Mở danh hiệu và trang phục tối thượng' },
];

/**
 * Tính Level chuẩn xác từ tổng điểm công đức dựa theo các mốc nội suy
 */
export function calculateLevelFromPoints(points: number): number {
  if (points <= 0) return 1;
  if (points >= 25000) return 100;

  for (let i = 0; i < LEVEL_MILESTONES.length - 1; i++) {
    const current = LEVEL_MILESTONES[i];
    const next = LEVEL_MILESTONES[i + 1];

    if (points >= current.points && points <= next.points) {
      const span = next.points - current.points;
      if (span <= 0) return current.level;
      const progress = (points - current.points) / span;
      return Math.min(
        next.level,
        Math.floor(current.level + progress * (next.level - current.level)),
      );
    }
  }

  return 100;
}

/**
 * Tính điểm công đức của từng hành động dựa trên bảng quy định:
 * - 10 lượt Like: +3, chỉ cộng khi hoàn thành nhóm 10
 * - Comment hợp lệ: +5
 * - Share livestream: +30
 * - Follow kênh: +100
 * - Người xem mới tham gia live: +5
 * - Tặng Hoa/Hoa hồng: +10 x số lượng
 * - Gift theo giá coin: +15 / +40 / +100 / +250 / +600 x số lượng
 */
export function calculateActionMeritPoints(action: TempleGameAction): number {
  if (action.eventType === 'JOIN') return 5;
  if (action.eventType === 'FOLLOW') return 100;
  if (action.eventType === 'SHARE') return 30;
  if (
    action.eventType === 'COMMENT' ||
    action.actionType === 'SAY_COMMENT' ||
    action.actionType === 'PRAY'
  ) {
    return 5;
  }
  if (action.eventType === 'LIKE') {
    const likes = Math.max(1, action.quantity ?? 1);
    return Math.floor(likes / 10) * 3;
  }
  if (
    action.eventType === 'GIFT' ||
    action.actionType === 'OFFER_FLOWERS' ||
    action.actionType === 'OFFER_INCENSE'
  ) {
    const isFlower =
      action.actionType === 'OFFER_FLOWERS' || /hoa|rose/i.test(action.giftName ?? '');
    const count = Math.max(1, action.quantity ?? 1);
    if (isFlower) {
      // Tặng Hoa/Hoa hồng: +10 điểm nhân với số lượng quà
      return count * 10;
    }
    // Bậc coin quà: 1-9 coin (+15), 10-49 coin (+40), 50-99 coin (+100), 100-499 coin (+250), 500+ coin (+600)
    const singleCoin = action.giftCoinValue ?? 1;
    let pointPerGift = 15;
    if (singleCoin >= 500) pointPerGift = 600;
    else if (singleCoin >= 100) pointPerGift = 250;
    else if (singleCoin >= 50) pointPerGift = 100;
    else if (singleCoin >= 10) pointPerGift = 40;
    else pointPerGift = 15;

    return count * pointPerGift;
  }
  return 1;
}

export function getCultivationInfo(meritPoints: number, isFemale = false) {
  const level = calculateLevelFromPoints(meritPoints);
  const rank =
    CULTIVATION_RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel) ??
    CULTIVATION_RANKS[CULTIVATION_RANKS.length - 1];

  const prefix = isFemale ? 'nu' : 'nam';
  const assetUrl = `/assets/${prefix}${rank.rankIndex}.png`;

  return {
    level,
    title: isFemale ? rank.nameFemale : rank.nameMale,
    rankIndex: rank.rankIndex,
    badgeColor: rank.badgeColor,
    haloColor: rank.haloColor,
    // Mốc Lv.90 trở lên (17.000 điểm) mở hào quang
    hasHalo: level >= 90,
    assetUrl,
  };
}
