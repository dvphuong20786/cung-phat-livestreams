export interface CultivationRank {
  minLevel: number;
  maxLevel: number;
  nameMale: string;
  nameFemale: string;
  badgeColor: string;
  haloColor?: string;
}

export const CULTIVATION_RANKS: CultivationRank[] = [
  {
    minLevel: 81,
    maxLevel: 100,
    nameMale: 'Trụ trì',
    nameFemale: 'Trụ trì',
    badgeColor: 'from-amber-400 via-yellow-300 to-amber-500',
    haloColor: '#ffd700',
  },
  {
    minLevel: 61,
    maxLevel: 80,
    nameMale: 'Tỳ kheo',
    nameFemale: 'Tỳ kheo ni',
    badgeColor: 'from-amber-500 to-orange-500',
    haloColor: '#f59e0b',
  },
  {
    minLevel: 41,
    maxLevel: 60,
    nameMale: 'Sa di',
    nameFemale: 'Sa di ni',
    badgeColor: 'from-yellow-600 to-amber-700',
  },
  {
    minLevel: 26,
    maxLevel: 40,
    nameMale: 'Cư sĩ',
    nameFemale: 'Cư sĩ',
    badgeColor: 'from-amber-700 to-stone-700',
  },
  {
    minLevel: 11,
    maxLevel: 25,
    nameMale: 'Phật tử',
    nameFemale: 'Phật tử',
    badgeColor: 'from-indigo-500 to-purple-600',
  },
  {
    minLevel: 1,
    maxLevel: 10,
    nameMale: 'Khách hành hương',
    nameFemale: 'Khách hành hương',
    badgeColor: 'from-slate-500 to-slate-700',
  },
];

export function getCultivationInfo(interactions: number, isFemale = false) {
  // Tương tác 10 lần lên level 1, 20 lần level 2... tối đa level 100
  const level = Math.min(100, Math.floor(Math.max(0, interactions) / 10));
  if (level <= 0) {
    return {
      level: 0,
      title: isFemale ? 'Tín nữ' : 'Thiện nam',
      badgeColor: 'from-slate-600 to-slate-800',
      hasHalo: false,
    };
  }
  const rank =
    CULTIVATION_RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel) ??
    CULTIVATION_RANKS[CULTIVATION_RANKS.length - 1];
  return {
    level,
    title: isFemale ? rank.nameFemale : rank.nameMale,
    badgeColor: rank.badgeColor,
    haloColor: rank.haloColor,
    hasHalo: level >= 81,
  };
}

