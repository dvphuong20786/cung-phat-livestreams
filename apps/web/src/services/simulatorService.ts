import type { LiveEventType, SimulatorInput } from '@live/shared';
import { command, socket } from './socket';
import { useTempleGameStore } from '../game/useTempleGameStore';

export const SIMULATED_NAMES = [
  'Thiện Tâm',
  'Diệu Âm',
  'Tuệ Minh',
  'Phước Lộc',
  'An Lạc',
  'Minh Trí',
  'Thanh Tịnh',
  'Ngọc Hoa',
  'Đức Hạnh',
  'Tâm Từ',
  'Quang Minh',
  'Bảo An',
  'Hồng Phúc',
  'Huệ Đăng',
  'Từ Bi',
  'Vạn Hạnh',
  'Chân Như',
  'Tịnh Độ',
  'Liên Hoa',
  'Trí Huệ',
];

export const SIMULATED_COMMENTS = [
  'Nam Mô A Di Đà Phật',
  'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật',
  'Nam Mô Quan Thế Âm Bồ Tát',
  'Cầu cho gia đạo bình an, vạn sự cát tường',
  'Cầu bình an cho cha mẹ và gia đình',
  'Nguyện đem công đức này hướng về khắp tất cả',
  'Thành tâm kính lễ mười phương chư Phật',
  'Tâm an vạn sự an',
];

let simCounter = 1;

export function createRandomSimulatedInput(custom?: Partial<SimulatorInput>): SimulatorInput {
  const nameIndex = Math.floor(Math.random() * SIMULATED_NAMES.length);
  const nickname = SIMULATED_NAMES[nameIndex];
  const count = simCounter++;
  const username = `sim_${count}`;

  const rand = Math.random();
  let type: LiveEventType = 'JOIN';
  let comment: string | undefined;
  let likeCount: number | undefined;
  let gift: { name: string; quantity: number; repeatEnd?: boolean } | undefined;

  // 50% vào ngồi niệm Phật (JOIN), 30% thả tim (LIKE), 15% bình luận, 5% dâng hoa
  if (rand < 0.5) {
    type = 'JOIN';
  } else if (rand < 0.8) {
    type = 'LIKE';
    likeCount = Math.floor(Math.random() * 5) + 1;
  } else if (rand < 0.95) {
    type = 'COMMENT';
    comment = SIMULATED_COMMENTS[Math.floor(Math.random() * SIMULATED_COMMENTS.length)];
  } else {
    type = 'GIFT';
    gift = { name: 'Rose', quantity: 1, repeatEnd: true };
  }

  return {
    type,
    username,
    nickname,
    comment,
    likeCount,
    gift,
    ...custom,
  };
}

export async function sendSimulatedVisitor(custom?: Partial<SimulatorInput>): Promise<void> {
  const input = createRandomSimulatedInput(custom);

  if (socket.connected) {
    try {
      await command('simulator:emit', input);
      return;
    } catch {
      // Tiếp tục fallback offline nếu socket không phản hồi
    }
  }

  // Fallback offline trực tiếp vào Game Store
  const actionType =
    input.type === 'GIFT'
      ? 'OFFER_FLOWERS'
      : input.type === 'COMMENT'
        ? 'SAY_COMMENT'
        : input.type === 'LIKE'
          ? 'ENTER_TEMPLE'
          : 'WELCOME';

  useTempleGameStore.getState().enqueue({
    actionId: `sim-action-${Date.now()}-${Math.random()}`,
    userId: `sim-${input.username}`,
    username: input.username,
    nickname: input.nickname,
    actionType,
    eventType: input.type,
    message: input.comment,
    quantity: input.gift?.quantity ?? input.likeCount,
    giftName: input.gift?.name,
    isSimulated: true,
    createdAt: Date.now(),
  });
}

/**
 * Gửi ngẫu nhiên 1 hoặc 2 người đi vào trong 1 lượt, giãn cách nhẹ giữa 2 người
 */
export async function sendSimulatedBatch(): Promise<number> {
  const count = Math.random() < 0.5 ? 1 : 2;
  for (let i = 0; i < count; i++) {
    await sendSimulatedVisitor();
    if (i < count - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return count;
}

