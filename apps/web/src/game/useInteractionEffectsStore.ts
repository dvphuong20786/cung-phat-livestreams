/**
 * ============================================================================
 * INTERACTION EFFECTS STORE & PRIORITY QUEUE
 * Quản lý hàng đợi hiệu ứng tương tác TikTok theo độ ưu tiên, chống trùng lặp,
 * xử lý combo liên tiếp và phân luồng hiệu ứng nhỏ (đồng thời) / lớn (tuần tự).
 * ============================================================================
 */

import { create } from 'zustand';
import type { LiveEvent, TempleGameAction } from '@live/shared';
import {
  EFFECT_PRIORITY,
  INTERACTION_EFFECTS_CONFIG,
} from './config/interactionEffectsConfig';
import {
  calculateLevelFromPoints,
  CULTIVATION_RANKS,
} from './cultivationLevel';
import { templeAudio } from './services/TempleAudioService';

// Loại hiệu ứng nhỏ (chạy đồng thời)
export type ConcurrentEffectType =
  | 'PETALS_ORBIT'           // Cánh hoa bay quanh nhân vật (Like 10, Watch time 15m)
  | 'PETALS_RAIN_SMALL'      // Mưa hoa nhỏ (Like 100, Combo 5 hoa, Gift 10-49 coin)
  | 'PETAL_FLY_TO_ALTAR'     // 1 bông hoa bay từ tên đến nhân vật
  | 'NAME_LOTUS_GLOW'        // Bông sen nhỏ sáng cạnh tên (Comment thường)
  | 'LOTUS_FOOT_BLOOM'       // Hoa sen nở dưới chân nhân vật (Nam mô A Di Đà Phật)
  | 'PETALS_CLUSTER';        // Cụm cánh hoa nhỏ (Gift 1-9 coin)

export interface ConcurrentEffect {
  id: string;
  type: ConcurrentEffectType;
  userName?: string;
  avatarUrl?: string;
  durationMs: number;
  startedAt: number;
  x?: number; // % toạ độ trên màn hình nếu có
  y?: number;
}

// Loại hiệu ứng lớn (xếp hàng ưu tiên)
export type QueuedEffectType =
  | 'RANK_UP'                // Chuyển cấp nhân vật (ưu tiên 100)
  | 'MEGA_GIFT'              // Gift >= 500 coin (ưu tiên 90)
  | 'MAJOR_GIFT'             // Gift 100-499 coin (ưu tiên 80)
  | 'LEVEL_UP'               // Lên level (ưu tiên 70)
  | 'FOLLOW'                 // Follow kênh (ưu tiên 60)
  | 'SHARE'                  // Share livestream (ưu tiên 50)
  | 'COMBO_10_FLOWERS';      // 10 Hoa liên tiếp (ưu tiên 45)

export interface QueuedEffect {
  id: string;
  type: QueuedEffectType;
  priority: number;
  userName: string;
  avatarUrl?: string;
  title: string;
  subTitle?: string;
  giftName?: string;
  coinValue?: number;
  oldLevel?: number;
  newLevel?: number;
  rankName?: string;
  gender?: 'male' | 'female';
  durationMs: number;
  createdAt: number;
}

interface InteractionEffectsState {
  // Cài đặt âm thanh
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Hiệu ứng nhỏ đồng thời (tối đa 40 hiệu ứng để chống giật)
  concurrentEffects: ConcurrentEffect[];

  // Hiệu ứng lớn hiện đang hiển thị
  currentQueuedEffect: QueuedEffect | null;

  // Hàng đợi các hiệu ứng lớn đang chờ
  queuedEffects: QueuedEffect[];

  // Bộ theo dõi combo của người chơi: userId -> { count, lastTime }
  combos: Record<string, { count: number; lastTime: number }>;

  // Lưu trữ level hiện tại của từng người chơi để phát hiện Level Up / Rank Up
  userLevels: Record<string, number>;

  // Thêm một sự kiện tương tác mới từ TikTok / Simulator
  triggerFromEvent: (event: LiveEvent) => void;

  // Thêm một hành động tương tác game
  triggerFromAction: (action: TempleGameAction, oldPoints: number, newPoints: number) => void;

  // Dọn dẹp hiệu ứng nhỏ đã hết hạn
  cleanupExpiredConcurrentEffects: () => void;

  // Kết thúc hiệu ứng lớn hiện tại và chạy tiếp hiệu ứng trong hàng đợi
  dismissCurrentQueuedEffect: () => void;

  // Xóa toàn bộ hiệu ứng
  clearAllEffects: () => void;
  triggerWatchTimeOrbit: (userName?: string) => void;
}

// Tập hợp lưu ID sự kiện đã xử lý để chống trùng lặp
const seenEventIds = new Set<string>();

export const useInteractionEffectsStore = create<InteractionEffectsState>((set, get) => ({
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  concurrentEffects: [],
  currentQueuedEffect: null,
  queuedEffects: [],
  combos: {},
  userLevels: {},

  cleanupExpiredConcurrentEffects: () => {
    const now = Date.now();
    set((state) => ({
      concurrentEffects: state.concurrentEffects.filter(
        (eff) => now - eff.startedAt < eff.durationMs,
      ),
    }));
  },

  dismissCurrentQueuedEffect: () => {
    const state = get();
    const nextQueue = [...state.queuedEffects];
    if (nextQueue.length === 0) {
      set({ currentQueuedEffect: null });
      return;
    }
    // Sắp xếp hàng đợi theo độ ưu tiên cao nhất -> thời gian tạo sớm nhất
    nextQueue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    });

    const nextEffect = nextQueue.shift()!;
    set({
      currentQueuedEffect: nextEffect,
      queuedEffects: nextQueue,
    });

    // Phát âm thanh nếu được bật
    if (get().soundEnabled) {
      if (nextEffect.type === 'MEGA_GIFT' || nextEffect.type === 'RANK_UP') {
        templeAudio.playBell();
      } else {
        templeAudio.playMoktak();
      }
    }

    // Tự động tắt sau khi hết thời gian
    window.setTimeout(() => {
      if (get().currentQueuedEffect?.id === nextEffect.id) {
        get().dismissCurrentQueuedEffect();
      }
    }, nextEffect.durationMs);
  },

  triggerFromEvent: (event: LiveEvent) => {
    // 1. Chống ghi nhận trùng bằng event ID
    if (event.id) {
      if (seenEventIds.has(event.id)) return;
      seenEventIds.add(event.id);
      if (seenEventIds.size > 2000) {
        const first = seenEventIds.values().next().value;
        if (first) seenEventIds.delete(first);
      }
    }

    const { soundEnabled } = get();
    const userId = event.user.id || event.user.username;
    const userName = event.user.nickname || event.user.username;
    const now = Date.now();

    // 2. Xử lý theo từng loại sự kiện TikTok
    // ------------------------------------------------------------------------
    // A. LIKE
    // ------------------------------------------------------------------------
    if (event.type === 'LIKE') {
      const likes = Math.max(1, event.likeCount ?? 1);

      // Mỗi 10 Like: hiển thị cánh hoa bay quanh nhân vật (1 giây)
      if (likes >= 10 || Math.random() < 0.3) {
        const newEff: ConcurrentEffect = {
          id: `like-${now}-${Math.random()}`,
          type: 'PETALS_ORBIT',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.like.petalsPer10Likes.durationMs,
          startedAt: now,
        };
        set((s) => ({
          concurrentEffects: [...s.concurrentEffects.slice(-30), newEff],
        }));
      }

      // Mỗi mốc 100 Like: mưa hoa nhỏ trong 2 giây
      if (likes >= 100) {
        const rainEff: ConcurrentEffect = {
          id: `like-rain-${now}-${Math.random()}`,
          type: 'PETALS_RAIN_SMALL',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.like.petalRainPer100Likes.durationMs,
          startedAt: now,
        };
        set((s) => ({
          concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff],
        }));
      }
      return;
    }

    // ------------------------------------------------------------------------
    // B. COMMENT
    // ------------------------------------------------------------------------
    if (event.type === 'COMMENT') {
      const commentText = event.comment ?? '';
      const isNamMo = /(nam\s*(mô|mo)|a\s*di\s*đà\s*phật)/i.test(commentText.normalize('NFC'));

      if (isNamMo) {
        // Comment "Nam mô A Di Đà Phật": hoa sen nở dưới chân nhân vật
        const bloomEff: ConcurrentEffect = {
          id: `comment-nammo-${now}-${Math.random()}`,
          type: 'LOTUS_FOOT_BLOOM',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.comment.namMoLotusBloomDurationMs,
          startedAt: now,
        };
        set((s) => ({
          concurrentEffects: [...s.concurrentEffects.slice(-30), bloomEff],
        }));
      } else {
        // Comment hợp lệ thông thường: một bông sen nhỏ sáng cạnh tên
        const badgeEff: ConcurrentEffect = {
          id: `comment-badge-${now}-${Math.random()}`,
          type: 'NAME_LOTUS_GLOW',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.comment.normalBadgeLotusDurationMs,
          startedAt: now,
        };
        set((s) => ({
          concurrentEffects: [...s.concurrentEffects.slice(-30), badgeEff],
        }));
      }
      return;
    }

    // ------------------------------------------------------------------------
    // C. SHARE (Hiệu ứng lớn hàng đợi)
    // ------------------------------------------------------------------------
    if (event.type === 'SHARE') {
      const shareEff: QueuedEffect = {
        id: `share-${now}-${Math.random()}`,
        type: 'SHARE',
        priority: EFFECT_PRIORITY.SHARE,
        userName,
        avatarUrl: event.user.avatarUrl,
        title: `${userName} đã chia sẻ livestream`,
        durationMs: INTERACTION_EFFECTS_CONFIG.share.durationMs,
        createdAt: now,
      };

      // Đẩy mưa hoa từ trên màn hình
      const rainEff: ConcurrentEffect = {
        id: `share-rain-${now}`,
        type: 'PETALS_RAIN_SMALL',
        userName,
        durationMs: INTERACTION_EFFECTS_CONFIG.share.durationMs,
        startedAt: now,
      };

      set((s) => ({
        concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff],
      }));

      // Đưa vào hàng đợi hiệu ứng lớn
      const state = get();
      if (!state.currentQueuedEffect) {
        set({ currentQueuedEffect: shareEff });
        if (soundEnabled) templeAudio.playMoktak();
        window.setTimeout(() => {
          if (get().currentQueuedEffect?.id === shareEff.id) {
            get().dismissCurrentQueuedEffect();
          }
        }, shareEff.durationMs);
      } else {
        set((s) => ({ queuedEffects: [...s.queuedEffects, shareEff] }));
      }
      return;
    }

    // ------------------------------------------------------------------------
    // D. FOLLOW (Hiệu ứng lớn hàng đợi)
    // ------------------------------------------------------------------------
    if (event.type === 'FOLLOW') {
      const followEff: QueuedEffect = {
        id: `follow-${now}-${Math.random()}`,
        type: 'FOLLOW',
        priority: EFFECT_PRIORITY.FOLLOW,
        userName,
        avatarUrl: event.user.avatarUrl,
        title: `Chào mừng ${userName}`,
        subTitle: 'Đã theo dõi kênh cúng Phật',
        durationMs: INTERACTION_EFFECTS_CONFIG.follow.durationMs,
        createdAt: now,
      };

      // Vòng sáng và sen nở
      const bloomEff: ConcurrentEffect = {
        id: `follow-bloom-${now}`,
        type: 'LOTUS_FOOT_BLOOM',
        userName,
        durationMs: INTERACTION_EFFECTS_CONFIG.follow.durationMs,
        startedAt: now,
      };

      set((s) => ({
        concurrentEffects: [...s.concurrentEffects.slice(-30), bloomEff],
      }));

      const state = get();
      if (!state.currentQueuedEffect) {
        set({ currentQueuedEffect: followEff });
        if (soundEnabled) templeAudio.playBell();
        window.setTimeout(() => {
          if (get().currentQueuedEffect?.id === followEff.id) {
            get().dismissCurrentQueuedEffect();
          }
        }, followEff.durationMs);
      } else {
        set((s) => ({ queuedEffects: [...s.queuedEffects, followEff] }));
      }
      return;
    }

    // ------------------------------------------------------------------------
    // E. HOA / HOA HỒNG & GIFT (Gộp COMBO & Bậc Coin)
    // ------------------------------------------------------------------------
    if (event.type === 'GIFT') {
      const giftName = event.gift?.name ?? 'Hoa cúng Phật';
      const quantity = Math.max(1, event.gift?.quantity ?? 1);
      const isFlower = /hoa|rose/i.test(giftName);
      const singleCoin = event.gift?.coinValue ?? (isFlower ? 1 : 1);
      const totalCoin = singleCoin * quantity;

      // Xử lý COMBO hoa liên tiếp của cùng người chơi
      const prevCombo = get().combos[userId];
      const isConsecutive = prevCombo && now - prevCombo.lastTime <= INTERACTION_EFFECTS_CONFIG.flower.comboTimeoutMs;
      const currentComboCount = isConsecutive ? prevCombo.count + quantity : quantity;

      set((s) => ({
        combos: { ...s.combos, [userId]: { count: currentComboCount, lastTime: now } },
      }));

      // TH1: HOA / HOA HỒNG
      if (isFlower) {
        if (currentComboCount >= 10) {
          // 10 Hoa liên tiếp: mưa hoa lớn và hiển thị tên người tặng
          const comboEff: QueuedEffect = {
            id: `flower-combo10-${now}-${Math.random()}`,
            type: 'COMBO_10_FLOWERS',
            priority: EFFECT_PRIORITY.NORMAL + 5,
            userName,
            avatarUrl: event.user.avatarUrl,
            title: `${userName} tặng liên tiếp ${currentComboCount} đóa Hoa`,
            giftName: 'Mưa hoa sen cúng Phật',
            durationMs: INTERACTION_EFFECTS_CONFIG.flower.combo10DurationMs,
            createdAt: now,
          };
          const rainEff: ConcurrentEffect = {
            id: `flower-rain-${now}`,
            type: 'PETALS_RAIN_SMALL',
            userName,
            durationMs: INTERACTION_EFFECTS_CONFIG.flower.combo10DurationMs,
            startedAt: now,
          };
          set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff] }));

          if (!get().currentQueuedEffect) {
            set({ currentQueuedEffect: comboEff });
            if (soundEnabled) templeAudio.playBell();
            window.setTimeout(() => {
              if (get().currentQueuedEffect?.id === comboEff.id) get().dismissCurrentQueuedEffect();
            }, comboEff.durationMs);
          } else {
            set((s) => ({ queuedEffects: [...s.queuedEffects, comboEff] }));
          }
          return;
        }

        if (currentComboCount >= 5) {
          // 5 Hoa liên tiếp: mưa hoa nhỏ
          const rainEff: ConcurrentEffect = {
            id: `flower-rain5-${now}`,
            type: 'PETALS_RAIN_SMALL',
            userName,
            durationMs: INTERACTION_EFFECTS_CONFIG.flower.combo5DurationMs,
            startedAt: now,
          };
          set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff] }));
          return;
        }

        // 1 Hoa: một bông hoa bay từ tên người tặng đến nhân vật
        const flyEff: ConcurrentEffect = {
          id: `flower-fly-${now}-${Math.random()}`,
          type: 'PETAL_FLY_TO_ALTAR',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.flower.singleFlyDurationMs,
          startedAt: now,
        };
        set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), flyEff] }));
        return;
      }

      // TH2: GIFT THEO BẬC COIN
      // -------------------------------------------------------------
      // Bậc 5 (>= 500 coin): Đại cảnh hoa sen, hào quang vàng, thông báo nổi bật
      if (totalCoin >= 500) {
        const megaEff: QueuedEffect = {
          id: `gift-mega-${now}-${Math.random()}`,
          type: 'MEGA_GIFT',
          priority: EFFECT_PRIORITY.MEGA_GIFT,
          userName,
          avatarUrl: event.user.avatarUrl,
          title: `ĐẠI CÚNG DƯỜNG: ${userName}`,
          subTitle: `Tặng ${quantity}× ${giftName} (${totalCoin} Coin)`,
          giftName,
          coinValue: totalCoin,
          durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier5.durationMs,
          createdAt: now,
        };
        if (!get().currentQueuedEffect) {
          set({ currentQueuedEffect: megaEff });
          if (soundEnabled) templeAudio.playBell();
          window.setTimeout(() => {
            if (get().currentQueuedEffect?.id === megaEff.id) get().dismissCurrentQueuedEffect();
          }, megaEff.durationMs);
        } else {
          set((s) => ({ queuedEffects: [...s.queuedEffects, megaEff] }));
        }
        return;
      }

      // Bậc 4 (100 - 499 coin): Mưa hoa toàn màn hình, hiện tên và tên gift
      if (totalCoin >= 100) {
        const majorEff: QueuedEffect = {
          id: `gift-major-${now}-${Math.random()}`,
          type: 'MAJOR_GIFT',
          priority: EFFECT_PRIORITY.MAJOR_GIFT,
          userName,
          avatarUrl: event.user.avatarUrl,
          title: `${userName} cúng dường ${quantity}× ${giftName}`,
          subTitle: `${totalCoin} Coin phước lành`,
          giftName,
          coinValue: totalCoin,
          durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier4.durationMs,
          createdAt: now,
        };
        const rainEff: ConcurrentEffect = {
          id: `gift-rain-${now}`,
          type: 'PETALS_RAIN_SMALL',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier4.durationMs,
          startedAt: now,
        };
        set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff] }));

        if (!get().currentQueuedEffect) {
          set({ currentQueuedEffect: majorEff });
          if (soundEnabled) templeAudio.playBell();
          window.setTimeout(() => {
            if (get().currentQueuedEffect?.id === majorEff.id) get().dismissCurrentQueuedEffect();
          }, majorEff.durationMs);
        } else {
          set((s) => ({ queuedEffects: [...s.queuedEffects, majorEff] }));
        }
        return;
      }

      // Bậc 3 (50 - 99 coin): Hoa sen nở và hào quang
      if (totalCoin >= 50) {
        const bloomEff: ConcurrentEffect = {
          id: `gift-bloom-${now}`,
          type: 'LOTUS_FOOT_BLOOM',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier3.durationMs,
          startedAt: now,
        };
        set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), bloomEff] }));
        return;
      }

      // Bậc 2 (10 - 49 coin): Mưa hoa và ánh sáng nhẹ
      if (totalCoin >= 10) {
        const rainEff: ConcurrentEffect = {
          id: `gift-rain-tier2-${now}`,
          type: 'PETALS_RAIN_SMALL',
          userName,
          durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier2.durationMs,
          startedAt: now,
        };
        set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), rainEff] }));
        return;
      }

      // Bậc 1 (1 - 9 coin): Cụm cánh hoa nhỏ
      const clusterEff: ConcurrentEffect = {
        id: `gift-cluster-${now}`,
        type: 'PETALS_CLUSTER',
        userName,
        durationMs: INTERACTION_EFFECTS_CONFIG.giftTiers.tier1.durationMs,
        startedAt: now,
      };
      set((s) => ({ concurrentEffects: [...s.concurrentEffects.slice(-30), clusterEff] }));
    }
  },

  // 3. Theo dõi Lên Level & Chuyển Cấp Bậc Nhân Vật
  triggerFromAction: (action: TempleGameAction, oldPoints: number, newPoints: number) => {
    const userId = action.userId;
    const userName = action.nickname;
    const now = Date.now();
    const oldLevel = calculateLevelFromPoints(oldPoints);
    const newLevel = calculateLevelFromPoints(newPoints);

    if (newLevel <= oldLevel) return;

    const isFemale = (userId.charCodeAt(0) || 0) % 12 !== 0;
    const gender = isFemale ? 'female' : 'male';

    const oldRank = CULTIVATION_RANKS.find((r) => oldLevel >= r.minLevel && oldLevel <= r.maxLevel) ?? CULTIVATION_RANKS[CULTIVATION_RANKS.length - 1];
    const newRank = CULTIVATION_RANKS.find((r) => newLevel >= r.minLevel && newLevel <= r.maxLevel) ?? CULTIVATION_RANKS[CULTIVATION_RANKS.length - 1];

    const isRankUp = newRank.rankIndex > oldRank.rankIndex;

    // A. CHUYỂN CẤP NHÂN VẬT (Ưu tiên cao nhất: 100)
    if (isRankUp) {
      const rankTitle = isFemale ? newRank.nameFemale : newRank.nameMale;
      const rankUpEff: QueuedEffect = {
        id: `rankup-${now}-${Math.random()}`,
        type: 'RANK_UP',
        priority: EFFECT_PRIORITY.RANK_UP,
        userName,
        avatarUrl: action.avatarUrl,
        title: `THĂNG CẤP PHẬT PHÁP: ${userName}`,
        subTitle: `Đắc vị: ${rankTitle} (Cấp bậc ${newRank.rankIndex})`,
        oldLevel,
        newLevel,
        rankName: rankTitle,
        gender,
        durationMs: INTERACTION_EFFECTS_CONFIG.rankUp.durationMs,
        createdAt: now,
      };

      const state = get();
      if (!state.currentQueuedEffect) {
        set({ currentQueuedEffect: rankUpEff });
        if (get().soundEnabled) templeAudio.playBell();
        window.setTimeout(() => {
          if (get().currentQueuedEffect?.id === rankUpEff.id) get().dismissCurrentQueuedEffect();
        }, rankUpEff.durationMs);
      } else {
        set((s) => ({ queuedEffects: [...s.queuedEffects, rankUpEff] }));
      }
      return;
    }

    // B. LÊN LEVEL (Ưu tiên 70)
    const levelUpEff: QueuedEffect = {
      id: `levelup-${now}-${Math.random()}`,
      type: 'LEVEL_UP',
      priority: EFFECT_PRIORITY.LEVEL_UP,
      userName,
      avatarUrl: action.avatarUrl,
      title: `${userName} thăng lên Cấp độ ${newLevel}`,
      subTitle: `Công đức tăng trưởng (Lv.${oldLevel} ➜ Lv.${newLevel})`,
      oldLevel,
      newLevel,
      durationMs: INTERACTION_EFFECTS_CONFIG.levelUp.durationMs,
      createdAt: now,
    };

    const state = get();
    if (!state.currentQueuedEffect) {
      set({ currentQueuedEffect: levelUpEff });
      if (get().soundEnabled) templeAudio.playBell();
      window.setTimeout(() => {
        if (get().currentQueuedEffect?.id === levelUpEff.id) get().dismissCurrentQueuedEffect();
      }, levelUpEff.durationMs);
    } else {
      set((s) => ({ queuedEffects: [...s.queuedEffects, levelUpEff] }));
    }
  },

  clearAllEffects: () => {
    set({
      concurrentEffects: [],
      currentQueuedEffect: null,
      queuedEffects: [],
      combos: {},
    });
  },

  triggerWatchTimeOrbit: (userName?: string) => {
    const eff: ConcurrentEffect = {
      id: `orbit-watch-${Date.now()}-${Math.random()}`,
      type: 'PETALS_ORBIT',
      startedAt: Date.now(),
      durationMs: INTERACTION_EFFECTS_CONFIG.watchTime.petalsDurationMs,
      userName,
    };
    set((s) => ({
      concurrentEffects: [...s.concurrentEffects.slice(-39), eff],
    }));
  },
}));
