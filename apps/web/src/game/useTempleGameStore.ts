import { create } from 'zustand';
import { templeGameActionPriority, type TempleGameAction } from '@live/shared';
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
type Quality = 'LOW' | 'MEDIUM' | 'HIGH';
interface GameStore {
  active: ActiveCharacter[];
  queue: TempleGameAction[];
  seatedVisitors: TempleGameAction[];
  paused: boolean;
  flowers: number;
  latest?: string;
  quality: Quality;
  enqueue: (action: TempleGameAction) => void;
  setState: (id: string, state: CharacterState) => void;
  complete: (id: string) => void;
  addFlower: () => void;
  clear: () => void;
  setPaused: (paused: boolean) => void;
  setQuality: (quality: Quality) => void;
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
  enqueue: (action) =>
    set((state) => {
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
      if (existing && action.actionType === 'ENTER_TEMPLE')
        return { seatedVisitors, latest: `${action.nickname} đã gửi thêm lượt thích` };
      const queue = sortActionsByPriority([...state.queue, action]);
      return {
        ...promote([...state.active], queue),
        seatedVisitors,
        latest:
          action.actionType === 'OFFER_FLOWERS'
            ? `${action.nickname} đang chuẩn bị dâng hoa`
            : action.actionType === 'SAY_COMMENT'
              ? `${action.nickname}: ${action.message ?? ''}`
            : action.actionType === 'WELCOME'
              ? `Chào mừng ${action.nickname} đến với ngôi chùa`
              : `${action.nickname} đang vào chùa`,
      };
    }),
  setState: (id, characterState) =>
    set((state) => ({
      active: state.active.map((c) =>
        c.action.actionId === id ? { ...c, state: characterState } : c,
      ),
    })),
  complete: (id) =>
    set((state) =>
      promote(
        state.active.filter((c) => c.action.actionId !== id),
        state.queue,
      ),
    ),
  addFlower: () => set({ flowers: get().flowers + 1 }),
  clear: () => set({ active: [], queue: [], seatedVisitors: [], flowers: 0, latest: undefined }),
  setPaused: (paused) => set({ paused }),
  setQuality: (quality) => set({ quality }),
}));
