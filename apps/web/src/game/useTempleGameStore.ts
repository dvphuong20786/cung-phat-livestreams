import { create } from 'zustand';
import { templeGameActionPriority, type TempleGameAction } from '@live/shared';
import { calculateActionMeritPoints } from './cultivationLevel';
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
}
type Quality = 'LOW' | 'MEDIUM' | 'HIGH';
interface GameStore {
  active: ActiveCharacter[];
  queue: TempleGameAction[];
  seatedVisitors: TempleGameAction[];
  paused: boolean;
  flowers: number;
  latest?: string;
  quality: Quality;
  allowSimulated: boolean;
  userInteractions: Record<string, number>;
  characterList: StoredCharacter[];
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
const promote = (active: ActiveCharacter[], queue: TempleGameAction[]) => {
  const next = sortActionsByPriority(queue).slice(0, 500);
  let runningCeremonies = active.filter((c) => isCeremony(c.action)).length;
  while (active.length < 12 && next.length) {
    let index = 0;
    if (runningCeremonies >= 2) {
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
export const useTempleGameStore = create<GameStore>((set, get) => ({
  active: [],
  queue: [],
  seatedVisitors: [],
  paused: false,
  flowers: 0,
  quality: 'MEDIUM',
  allowSimulated: true,
  userInteractions: {},
  characterList: [],
  enqueue: (action) =>
    set((state) => {
      // Chế độ không thêm người giả lập
      if (!state.allowSimulated && action.isSimulated) {
        return state;
      }
      // Điểm công đức: lấy trực tiếp từ database nếu server gửi về, hoặc tính cộng dồn nếu chạy offline
      const points =
        action.meritPoints !== undefined
          ? action.meritPoints
          : (state.userInteractions[action.userId] || 0) + calculateActionMeritPoints(action);

      const userInteractions = {
        ...state.userInteractions,
        [action.userId]: points,
      };

      const previousSeat = state.seatedVisitors.findIndex(
        (visitor) => visitor.userId === action.userId,
      );
      const updatedSeatedVisitors =
        previousSeat >= 0
          ? state.seatedVisitors.map((visitor, index) =>
              index === previousSeat ? action : visitor,
            )
          : [...state.seatedVisitors, action];
      const seatedVisitors = [...updatedSeatedVisitors]
        .sort((firstVisitor, secondVisitor) => {
          const priorityDifference =
            templeGameActionPriority(secondVisitor) - templeGameActionPriority(firstVisitor);
          if (priorityDifference !== 0) return priorityDifference;
          return secondVisitor.createdAt - firstVisitor.createdAt;
        })
        .slice(0, 80);
      const existing =
        state.active.some((c) => c.action.userId === action.userId) ||
        state.queue.some((a) => a.userId === action.userId && a.actionType === action.actionType);
      if (existing && action.actionType === 'ENTER_TEMPLE') {
        return {
          seatedVisitors,
          userInteractions,
          latest: `${action.nickname} đã gửi thêm lượt thích`,
        };
      }

      const queue = sortActionsByPriority([...state.queue, action]);

      return {
        ...promote([...state.active], queue),
        seatedVisitors,
        userInteractions,
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

      const characterList = Array.from(map.values()).sort(
        (a, b) => b.meritPoints - a.meritPoints,
      );

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
            v.userId === completedChar.action.userId ? { ...v, seatedAt: now } : v,
          );
        } else {
          updatedSeated = [{ ...completedChar.action, seatedAt: now }, ...state.seatedVisitors];
        }
      }
      return {
        ...promote(
          state.active.filter((c) => c.action.actionId !== id),
          state.queue,
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
      flowers: 0,
      latest: undefined,
    }),
  setPaused: (paused) => set({ paused }),
  setQuality: (quality) => set({ quality }),
  setAllowSimulated: (allowSimulated) => set({ allowSimulated }),
}));
