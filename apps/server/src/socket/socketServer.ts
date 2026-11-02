import type { Server } from 'socket.io';
import {
  connectSchema,
  simulatorSchema,
  templeGameActionFor,
  type LiveEvent,
  type SimulatorInput,
} from '@live/shared';
import type { EventService } from '../services/EventService.js';
import type { LiveConnector as TikTokConnector } from '../connectors/LiveConnector.js';
import type { CharacterStore } from '../services/CharacterStore.js';
import { WatchTimeTracker } from '../services/WatchTimeTracker.js';

const autoSimulationNames = [
  'Thiện Tâm',
  'Diệu Âm',
  'Tuệ Minh',
  'An Lạc',
  'Ngọc Hoa',
  'Tâm Từ',
  'Liên Hoa',
  'Trí Huệ',
];
const autoSimulationComments = [
  'Nam Mô A Di Đà Phật',
  'Cầu cho gia đạo bình an',
  'Nguyện mọi người được an lành',
  'Tâm an vạn sự an',
];
let autoSimulationCounter = 1;

function createAutoSimulationInput(): SimulatorInput {
  const nickname = autoSimulationNames[Math.floor(Math.random() * autoSimulationNames.length)];
  const username = `auto_sim_${autoSimulationCounter++}`;
  const randomValue = Math.random();
  if (randomValue < 0.5) return { type: 'JOIN', username, nickname };
  if (randomValue < 0.8) {
    return { type: 'LIKE', username, nickname, likeCount: Math.floor(Math.random() * 5) + 1 };
  }
  if (randomValue < 0.95) {
    return {
      type: 'COMMENT',
      username,
      nickname,
      comment: autoSimulationComments[Math.floor(Math.random() * autoSimulationComments.length)],
    };
  }
  return {
    type: 'GIFT',
    username,
    nickname,
    gift: { name: 'Rose', quantity: 1, repeatEnd: true },
  };
}

export function setupSockets(
  io: Server,
  events: EventService,
  tiktok: TikTokConnector,
  characterStore?: CharacterStore,
) {
  let gamePaused = false;
  let autoSimulationEnabled = false;
  let autoSimulationTimer: ReturnType<typeof setTimeout> | null = null;
  let autoSimulationRunId = 0;
  const watchTimeTracker = new WatchTimeTracker();

  const publish = (event: LiveEvent, alreadyProcessed = false) => {
    let charData: { meritPoints?: number; level?: number; rankName?: string } = {};
    if (characterStore) {
      const { character } = characterStore.awardPointsForEvent(event);
      // Các event tiếp theo dùng chung ID bền vững đã lưu trong SQLite.
      event.user.id = character.userId;
      event.user.username = character.username;
      event.user.nickname = character.nickname;
      if (character.avatarUrl) event.user.avatarUrl = character.avatarUrl;
      charData = {
        meritPoints: character.meritPoints,
        level: character.level,
        rankName: character.rankName,
      };
      if (!character.isSimulated) io.emit('character:updated', character);
      if (event.type === 'JOIN') watchTimeTracker.startWatching(character.userId, event.timestamp);
    }

    if (!alreadyProcessed) events.process(event);
    io.emit('tiktok:event', event);
    io.emit('stats:update', events.stats.snapshot());

    const action = templeGameActionFor(event);
    if (action) {
      if (charData.meritPoints !== undefined) {
        action.meritPoints = charData.meritPoints;
        action.level = charData.level;
        action.rankName = charData.rankName;
      }
      io.emit('game:action', action);
    }
  };

  const runAutoSimulationBatch = async (runId: number) => {
    if (!autoSimulationEnabled || runId !== autoSimulationRunId) return;
    const visitorCount = Math.random() < 0.5 ? 1 : 2;
    for (let index = 0; index < visitorCount; index++) {
      if (!autoSimulationEnabled || runId !== autoSimulationRunId) return;
      const event = events.simulate(createAutoSimulationInput());
      publish(event, true);
      if (index < visitorCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
    if (!autoSimulationEnabled || runId !== autoSimulationRunId) return;
    autoSimulationTimer = setTimeout(() => void runAutoSimulationBatch(runId), 5000);
    autoSimulationTimer.unref();
  };

  const setAutoSimulationEnabled = (enabled: boolean) => {
    autoSimulationEnabled = enabled;
    autoSimulationRunId += 1;
    if (autoSimulationTimer) {
      clearTimeout(autoSimulationTimer);
      autoSimulationTimer = null;
    }
    io.emit('simulation:auto-status', { enabled });
    if (enabled) void runAutoSimulationBatch(autoSimulationRunId);
  };

  tiktok.on('event', (event: LiveEvent) => publish(event));
  tiktok.on('status', (status) => {
    if (status.state !== 'CONNECTED') watchTimeTracker.clear();
    io.emit('connection:status', status);
  });
  tiktok.on('error-safe', (message) => io.emit('system:error', { message }));

  io.on('connection', (socket) => {
    const characters = characterStore ? characterStore.getRealCharacters() : [];

    socket.emit('snapshot', {
      connection: tiktok.status,
      events: events.recent(),
      stats: events.stats.snapshot(),
      game: { paused: gamePaused },
      simulation: { autoEnabled: autoSimulationEnabled },
      characters,
    });

    socket.on('state:request', (_v, ack) => {
      const currentCharacters = characterStore ? characterStore.getRealCharacters() : [];

      ack?.({
        success: true,
        data: {
          connection: tiktok.status,
          events: events.recent(),
          stats: events.stats.snapshot(),
          game: { paused: gamePaused },
          simulation: { autoEnabled: autoSimulationEnabled },
          characters: currentCharacters,
        },
      });
    });

    socket.on('characters:request', (_v, ack) => {
      const currentChars = characterStore ? characterStore.getRealCharacters() : [];
      ack?.({ success: true, data: currentChars });
    });

    socket.on('tiktok:connect', async (input, ack) => {
      const p = connectSchema.safeParse(input);
      if (!p.success) return ack?.({ success: false, error: p.error.issues[0]?.message });
      try {
        await tiktok.connect(p.data.username, p.data.autoReconnect);
        characterStore?.resetLiveSessionLimits();
        watchTimeTracker.clear();
        ack?.({ success: true });
      } catch (e) {
        ack?.({ success: false, error: e instanceof Error ? e.message : String(e) });
      }
    });

    socket.on('tiktok:disconnect', async (_v, ack) => {
      await tiktok.disconnect();
      ack?.({ success: true });
    });

    socket.on('simulator:emit', (input, ack) => {
      const p = simulatorSchema.safeParse(input);
      if (!p.success) return ack?.({ success: false, error: p.error.issues[0]?.message });
      const event = events.simulate(p.data);
      publish(event, true);
      ack?.({ success: true, data: event });
    });

    socket.on('simulator:auto-control', (input, ack) => {
      if (typeof input?.enabled !== 'boolean') {
        return ack?.({ success: false, error: 'Trạng thái giả lập tự động không hợp lệ' });
      }
      setAutoSimulationEnabled(input.enabled);
      ack?.({ success: true, data: { enabled: autoSimulationEnabled } });
    });

    socket.on('game:control', (input, ack) => {
      if (input?.command === 'CLEAR') io.emit('game:clear');
      else if (input?.command === 'PAUSE') {
        gamePaused = true;
        io.emit('game:paused', true);
      } else if (input?.command === 'RESUME') {
        gamePaused = false;
        io.emit('game:paused', false);
      } else return ack?.({ success: false, error: 'Lệnh game không hợp lệ' });
      ack?.({ success: true });
    });

    socket.on('stats:reset', (input, ack) => {
      events.clear(
        input?.source === 'SIMULATOR'
          ? 'SIMULATOR'
          : input?.source === 'TIKTOK'
            ? 'TIKTOK'
            : undefined,
      );
      io.emit('stats:update', events.stats.snapshot());
      io.emit('events:reset', { source: input?.source });
      ack?.({ success: true });
    });
  });

  const watchTimeInterval = setInterval(() => {
    if (!characterStore || tiktok.status.state !== 'CONNECTED') return;

    const dueUserIds = watchTimeTracker.collectDueUserIds();
    for (const userId of dueUserIds) {
      const result = characterStore.awardWatchTime(userId);
      if (result && !result.character.isSimulated) {
        io.emit('character:updated', result.character);
      }
    }
  }, 10_000);
  watchTimeInterval.unref();
}
