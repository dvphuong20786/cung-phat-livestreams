/**
 * ============================================================================
 * CẤU HÌNH HỆ THỐNG ĐIỂM CÔNG ĐỨC, LEVEL VÀ HIỆU ỨNG TƯƠNG TÁC TIKTOK
 * File này tách biệt toàn bộ tham số để có thể tùy biến dễ dàng mà không sửa logic code.
 * ============================================================================
 */

export interface EffectRankPriority {
  RANK_UP: number;
  MEGA_GIFT: number;
  MAJOR_GIFT: number;
  LEVEL_UP: number;
  FOLLOW: number;
  SHARE: number;
  NORMAL: number;
}

export const EFFECT_PRIORITY: EffectRankPriority = {
  RANK_UP: 100,      // Chuyển cấp nhân vật (cao nhất)
  MEGA_GIFT: 90,     // Gift từ 500 coin
  MAJOR_GIFT: 80,    // Gift 100 - 499 coin
  LEVEL_UP: 70,      // Lên level
  FOLLOW: 60,        // Follow kênh
  SHARE: 50,         // Share livestream
  NORMAL: 40,        // Like / Comment / Gift nhỏ
};

export const INTERACTION_EFFECTS_CONFIG = {
  // 1. Like
  like: {
    petalsPer10Likes: { min: 1, max: 3, durationMs: 1000 },
    petalRainPer100Likes: { durationMs: 2000, petalCount: 15 },
  },

  // 2. Comment
  comment: {
    normalBadgeLotusDurationMs: 2000,
    namMoLotusBloomDurationMs: 3000,
  },

  // 3. Share
  share: {
    durationMs: 3000,
    petalCount: 25,
    messageTemplate: '{name} đã chia sẻ livestream',
  },

  // 4. Follow
  follow: {
    durationMs: 3000,
    haloDurationMs: 3000,
    messageTemplate: 'Chào mừng {name}',
  },

  // 5. Thời gian xem (15 phút)
  watchTime: {
    intervalMs: 15 * 60 * 1000, // 15 phút
    pointsAwarded: 60,
    petalsDurationMs: 2000,
    petalCount: 6,
  },

  // 6. Hoa / Hoa hồng combo
  flower: {
    singleFlyDurationMs: 1500,
    combo5DurationMs: 2500,
    combo5PetalCount: 20,
    combo10DurationMs: 4000,
    combo10PetalCount: 45,
    comboTimeoutMs: 8000, // Nếu sau 8s không gửi thêm thì reset chuỗi combo
  },

  // 7. Gift theo bậc Coin
  giftTiers: {
    tier1: { minCoin: 1, maxCoin: 9, durationMs: 1500, petalCount: 8, name: 'Cụm cánh hoa nhỏ' },
    tier2: { minCoin: 10, maxCoin: 49, durationMs: 2200, petalCount: 22, lightGlow: true, name: 'Mưa hoa & ánh sáng nhẹ' },
    tier3: { minCoin: 50, maxCoin: 99, durationMs: 3200, lotusBloom: true, aura: true, name: 'Hoa sen nở & hào quang' },
    tier4: { minCoin: 100, maxCoin: 499, durationMs: 4500, fullScreenRain: true, showBanner: true, name: 'Mưa hoa toàn màn hình' },
    tier5: { minCoin: 500, maxCoin: 999999, durationMs: 6500, grandLotus: true, goldenAura: true, showBanner: true, sound: 'gong', name: 'Đại cảnh hoa sen & hào quang vàng' },
  },

  // 8. Lên level
  levelUp: {
    durationMs: 3500,
    petalCount: 30,
    showLevelBadge: true,
  },

  // 9. Chuyển cấp bậc nhân vật
  rankUp: {
    durationMs: 5000,
    grandLotus: true,
    fadeOldCharacterMs: 1000,
    showTitleBanner: true,
  },

  // Sprite Sheet thông số:
  sprites: {
    hoa1: {
      url: '/assets/hoa1.png',
      cols: 4,
      rows: 4,
      totalFrames: 16,
    },
    hoa2: {
      url: '/assets/hoa2.png',
      cols: 4,
      rows: 3,
      totalFrames: 12,
    },
  },
};

