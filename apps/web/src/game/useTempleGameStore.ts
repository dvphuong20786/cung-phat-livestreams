import { create } from 'zustand';
import { templeGameActionPriority, type TempleGameAction } from '@live/shared';
import { calculateActionMeritPoints } from './cultivationLevel';
import { calculateSeatingDuration } from './seatingDuration';
import { useInteractionEffectsStore } from './useInteractionEffectsStore';
export type CharacterState =
  | 'SPAWNING'
  | 'WALKING_TO_GATE'
  | 'WALKING_TO_ALTAR'
  | 'WAITING'
  | 'PRAYING'
  | 'OFFERING_FLOWERS'
  | 'BOWING'
  | 'EXITING'
  | 'COMPLETED';
export interface ActiveCharacter {
  action: TempleGameAction;
  state: CharacterState;
  startedAt: number;
}
export interface StoredCharacter {
  userId: string;
  username?: string;
  nickname: string;
  avatarUrl?: string;
  isSimulated?: boolean;
  meritPoints: number;
  level: number;
  rankName?: string;
  watchTimeAwardedToday?: number;
  gender?: 'male' | 'female';
}
type Quality = 'LOW' | 'MEDIUM' | 'HIGH';
export interface RecentDonor {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  giftName?: string;
  quantity?: number;
  timestamp: number;
  isSimulated?: boolean;
}
interface GameStore {
  active: ActiveCharacter[];
  queue: TempleGameAction[];
  seatedVisitors: TempleGameAction[];
  paused: boolean;
  flowers: number;
  latest?: string;
  quality: Quality;
  allowSimulated: boolean;
  fifoQueue: boolean;
  mobilePriorityAdmission: boolean;
  userInteractions: Record<string, number>;
  userLikeCountsInSession: Record<string, number>;
  characterList: StoredCharacter[];
  recentDonors: RecentDonor[];
  enqueue: (action: TempleGameAction) => void;
  syncCharacters: (
    characters: Array<Partial<StoredCharacter> & { userId: string; meritPoints: number }>,
  ) => void;
  setState: (id: string, state: CharacterState) => void;
  complete: (id: string) => void;
  addFlower: () => void;
  clear: () => void;
  setPaused: (paused: boolean) => void;
  setQuality: (quality: Quality) => void;
  setAllowSimulated: (allowed: boolean) => void;
  setFifoQueue: (enabled: boolean) => void;
  setMobilePriorityAdmission: (enabled: boolean) => void;
}
const isCeremony = (a: TempleGameAction) =>
  a.actionType === 'OFFER_FLOWERS' || a.actionType === 'OFFER_INCENSE';
const sortActionsByPriority = (actions: TempleGameAction[]) =>
  [...actions].sort((firstAction, secondAction) => {
    const priorityDifference =
      templeGameActionPriority(secondAction) - templeGameActionPriority(firstAction);
    if (priorityDifference !== 0) return priorityDifference;
    return firstAction.createdAt - secondAction.createdAt;
  });
const promote = (
  active: ActiveCharacter[],
  queue: TempleGameAction[],
  fifoQueue: boolean = false,
  mobilePriorityAdmission: boolean = false,
) => {
  const next = fifoQueue
    ? [...queue].sort((first, second) => first.createdAt - second.createdAt).slice(0, 500)
    : sortActionsByPriority(queue).slice(0, 500);
  let runningCeremonies = active.filter((c) => isCeremony(c.action)).length;
  const activeLimit = mobilePriorityAdmission ? 500 : 12;
  while (active.length < activeLimit && next.length) {
    let index = 0;
    if (!mobilePriorityAdmission && runningCeremonies >= 2) {
      const ordinary = next.findIndex((action) => !isCeremony(action));
      if (ordinary >= 0) index = ordinary;
      else break;
    }
    const action = next.splice(index, 1)[0];
    active.push({ action, state: 'SPAWNING', startedAt: Date.now() });
    if (isCeremony(action)) runningCeremonies++;
  }
  return { active: [...active], queue: next };
};
export function allocateSeatIndex(
  seatedVisitors: TempleGameAction[],
  activeCharacters: ActiveCharacter[],
  userId: string,
  totalSeats: number = 24,
): number {
  // 1. Tái sử dụng ghế cũ nếu user này đã được cấp ghế trước đó
  const existingSeated = seatedVisitors.find(
    (v) => v.userId === userId && v.seatIndex !== undefined,
  );
  if (existingSeated && existingSeated.seatIndex !== undefined) {
    return existingSeated.seatIndex;
  }
  const existingActive = activeCharacters.find(
    (c) => c.action.userId === userId && c.action.seatIndex !== undefined,
  );
  if (existingActive && existingActive.action.seatIndex !== undefined) {
    return existingActive.action.seatIndex;
  }

  // 2. Gom các ghế đang bị chiếm còn trong thời hạn
  const now = Date.now();
  const occupiedSeats = new Set<number>();
  for (const visitor of seatedVisitors) {
    if (visitor.seatIndex !== undefined && visitor.userId !== userId) {
      const userInteractionPoints =
        useTempleGameStore.getState().userInteractions[visitor.userId] || 0;
      const duration = calculateSeatingDuration(visitor, userInteractionPoints);
      const startTime = visitor.seatedAt ?? visitor.createdAt;
      if (now - startTime <= duration) {
        occupiedSeats.add(visitor.seatIndex);
      }
    }
  }
  for (const activeChar of activeCharacters) {
    if (activeChar.action.seatIndex !== undefined && activeChar.action.userId !== userId) {
      occupiedSeats.add(activeChar.action.seatIndex);
    }
  }

  // 3. Phân bổ theo hàng: Hàng đầu full mới đến Hàng 2
  // Với 24 ghế: Hàng 0 = 0..11, Hàng 1 = 12..23
  const halfSeats = Math.floor(totalSeats / 2);
  const row0Seats: number[] = [];
  const row1Seats: number[] = [];

  for (let i = 0; i < halfSeats; i++) {
    if (!occupiedSeats.has(i)) {
      row0Seats.push(i);
    }
  }
  for (let i = halfSeats; i < totalSeats; i++) {
    if (!occupiedSeats.has(i)) {
      row1Seats.push(i);
    }
  }

  // Ưu tiên hàng đầu (Row 0): nếu còn chỗ, chọn ngẫu nhiên 1 ghế trong hàng đầu
  if (row0Seats.length > 0) {
    const randomIndex = Math.floor(Math.random() * row0Seats.length);
    return row0Seats[randomIndex];
  }

  // Hàng đầu đã full -> chọn ngẫu nhiên 1 ghế trong hàng 2 (Row 1)
  if (row1Seats.length > 0) {
    const randomIndex = Math.floor(Math.random() * row1Seats.length);
    return row1Seats[randomIndex];
  }

  // Nếu cả 2 hàng đều full, fallback chọn ngẫu nhiên theo user hash
  const userHash = Math.abs([...userId].reduce((total, c) => total + c.charCodeAt(0), 0));
  return userHash % totalSeats;
}

export const useTempleGameStore = create<GameStore>((set, get) => ({
  active: [],
  queue: [],
  seatedVisitors: [],
  paused: false,
  flowers: 0,
  quality: 'MEDIUM',
  allowSimulated: true,
  fifoQueue: false,
  mobilePriorityAdmission: false,
  userInteractions: {},
  userLikeCountsInSession: {},
  characterList: [],
  recentDonors: [],
  enqueue: (action) =>
    set((state) => {
      // Chế độ không thêm người giả lập
      if (!state.allowSimulated && action.isSimulated) {
        return state;
      }
      const userLikeCountsInSession = { ...state.userLikeCountsInSession };
      let offlinePointsAwarded = calculateActionMeritPoints(action);
      if (action.eventType === 'LIKE') {
        const previousLikeCount = userLikeCountsInSession[action.userId] || 0;
        const currentLikeCount = previousLikeCount + Math.max(1, action.quantity ?? 1);
        const completedGroupsBefore = Math.floor(previousLikeCount / 10);
        const completedGroupsAfter = Math.floor(currentLikeCount / 10);
        offlinePointsAwarded = (completedGroupsAfter - completedGroupsBefore) * 3;
        userLikeCountsInSession[action.userId] = currentLikeCount;
      }

      // Ưu tiên tổng điểm từ database; khi mất server mới cộng dồn theo bảng điểm phía web.
      const points =
        action.meritPoints !== undefined
          ? action.meritPoints
          : (state.userInteractions[action.userId] || 0) + offlinePointsAwarded;

      const userInteractions = {
        ...state.userInteractions,
        [action.userId]: points,
      };

      // Gán ghế ngồi cố định cho người chơi (hàng đầu full sang hàng 2, trong hàng chọn ngẫu nhiên)
      const seatIndex =
        action.seatIndex !== undefined
          ? action.seatIndex
          : allocateSeatIndex(state.seatedVisitors, state.active, action.userId);

      const actionWithSeat: TempleGameAction = {
        ...action,
        seatIndex,
      };

      const previousSeat = state.seatedVisitors.findIndex(
        (visitor) => visitor.userId === action.userId,
      );
      const updatedSeatedVisitors =
        previousSeat >= 0
          ? state.seatedVisitors.map((visitor, index) =>
              index === previousSeat ? { ...visitor, ...actionWithSeat } : visitor,
            )
          : [...state.seatedVisitors, actionWithSeat];
      const seatedVisitors = [...updatedSeatedVisitors]
        .sort((firstVisitor, secondVisitor) => {
          const priorityDifference =
            templeGameActionPriority(secondVisitor) - templeGameActionPriority(firstVisitor);
          if (priorityDifference !== 0) return priorityDifference;
          return secondVisitor.createdAt - firstVisitor.createdAt;
        })
        .slice(0, 80);
      // Cập nhật danh sách 5 người donate mới nhất
      const isDonation =
        action.eventType === 'GIFT' ||
        action.actionType === 'OFFER_FLOWERS' ||
        action.actionType === 'OFFER_INCENSE';

      let updatedRecentDonors = state.recentDonors;
      if (isDonation && action.isSimulated !== true) {
        const newDonor: RecentDonor = {
          userId: action.userId,
          nickname: action.nickname,
          avatarUrl: action.avatarUrl,
          giftName:
            action.giftName || (action.actionType === 'OFFER_FLOWERS' ? 'Hoa cúng Phật' : 'Lễ vật'),
          quantity: action.quantity || 1,
          timestamp: Date.now(),
          isSimulated: false,
        };
        const filtered = state.recentDonors.filter((d) => d.userId !== action.userId);
        updatedRecentDonors = [newDonor, ...filtered].slice(0, 5);
      }

      const existing =
        state.active.some((c) => c.action.userId === action.userId) ||
        state.queue.some((a) => a.userId === action.userId && a.actionType === action.actionType);
      if (existing && action.actionType === 'ENTER_TEMPLE') {
        return {
          seatedVisitors,
          userInteractions,
          userLikeCountsInSession,
          recentDonors: updatedRecentDonors,
          latest: `${action.nickname} đã gửi thêm lượt thích`,
        };
      }

      const queue = sortActionsByPriority([...state.queue, actionWithSeat]);

      return {
        ...promote(
          [...state.active],
          queue,
          state.fifoQueue,
          state.mobilePriorityAdmission,
        ),
        seatedVisitors,
        userInteractions,
        userLikeCountsInSession,
        recentDonors: updatedRecentDonors,
        latest:
          action.actionType === 'OFFER_FLOWERS'
            ? `${action.nickname} đang chuẩn bị dâng hoa`
            : action.actionType === 'SAY_COMMENT'
              ? `${action.nickname}: ${action.message ?? ''}`
              : action.actionType === 'WELCOME' || action.eventType === 'JOIN'
                ? `${action.nickname} vừa vào chánh điện`
                : `${action.nickname} đang vào chùa`,
      };
    }),
  syncCharacters: (characters) =>
    set((state) => {
      const updatedInteractions = { ...state.userInteractions };
      const map = new Map<string, StoredCharacter>();
      for (const item of state.characterList) {
        map.set(item.userId, item);
      }

      for (const char of characters) {
        if (!char.userId) continue;
        updatedInteractions[char.userId] = char.meritPoints ?? 0;
        const existing = map.get(char.userId);
        map.set(char.userId, {
          userId: char.userId,
          username: char.username ?? existing?.username,
          nickname: char.nickname ?? existing?.nickname ?? char.userId,
          avatarUrl: char.avatarUrl ?? existing?.avatarUrl,
          isSimulated: char.isSimulated ?? existing?.isSimulated,
          meritPoints: char.meritPoints ?? 0,
          level: char.level ?? existing?.level ?? 1,
          rankName: char.rankName ?? existing?.rankName,
        });
      }

      const characterList = Array.from(map.values()).sort((a, b) => b.meritPoints - a.meritPoints);

      return {
        userInteractions: updatedInteractions,
        characterList,
      };
    }),
  setState: (id, characterState) =>
    set((state) => ({
      active: state.active.map((c) =>
        c.action.actionId === id ? { ...c, state: characterState } : c,
      ),
    })),
  complete: (id) =>
    set((state) => {
      const completedChar = state.active.find((c) => c.action.actionId === id);
      const now = Date.now();
      let updatedSeated = state.seatedVisitors;
      if (completedChar) {
        const exists = state.seatedVisitors.some((v) => v.userId === completedChar.action.userId);
        if (exists) {
          updatedSeated = state.seatedVisitors.map((v) =>
            v.userId === completedChar.action.userId
              ? { ...v, ...completedChar.action, seatedAt: now }
              : v,
          );
        } else {
          updatedSeated = [{ ...completedChar.action, seatedAt: now }, ...state.seatedVisitors];
        }
      }
      return {
        ...promote(
          state.active.filter((c) => c.action.actionId !== id),
          state.queue,
          state.fifoQueue,
          state.mobilePriorityAdmission,
        ),
        seatedVisitors: updatedSeated,
      };
    }),
  addFlower: () => set({ flowers: get().flowers + 1 }),
  clear: () =>
    set({
      active: [],
      queue: [],
      seatedVisitors: [],
      recentDonors: [],
      flowers: 0,
      latest: undefined,
    }),
  setPaused: (paused) => set({ paused }),
  setQuality: (quality) => set({ quality }),
  setAllowSimulated: (allowSimulated) => set({ allowSimulated }),
  setFifoQueue: (fifoQueue) => set({ fifoQueue }),
  setMobilePriorityAdmission: (mobilePriorityAdmission) => set({ mobilePriorityAdmission }),
}));
