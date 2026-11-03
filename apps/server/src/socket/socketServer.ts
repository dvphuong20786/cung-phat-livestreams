import type { Server } from 'socket.io';
import {
  connectSchema,
  liveUrlSchema,
  simulatorSchema,
  templeGameActionFor,
  type LiveEvent,
  type SimulatorInput,
} from '@live/shared';
import type { EventService } from '../services/EventService.js';
import type { LiveConnector as TikTokConnector } from '../connectors/LiveConnector.js';
import type { CharacterStore } from '../services/CharacterStore.js';
import { WatchTimeTracker } from '../services/WatchTimeTracker.js';
import { LiveSessionListsStore } from '../services/LiveSessionListsStore.js';

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
  youtube: TikTokConnector,
  facebook: TikTokConnector,
  characterStore?: CharacterStore,
) {
  let gamePaused = false;
  let autoSimulationEnabled = false;
  let autoSimulationTimer: ReturnType<typeof setTimeout> | null = null;
  let autoSimulationRunId = 0;
  const watchTimeTracker = new WatchTimeTracker();
  const liveSessionLists = new LiveSessionListsStore();

  const emitSessionLists = () => {
    io.emit('session:lists', liveSessionLists.snapshot());
  };

  const publish = (event: LiveEvent, alreadyProcessed = false) => {
    let charData: { meritPoints?: number; level?: number; rankName?: string } = {};
    if (characterStore) {
      const { character, pointsAwarded } = characterStore.awardPointsForEvent(event);
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
      liveSessionLists.recordEvent(event, character, pointsAwarded);
      if (!character.isSimulated && (pointsAwarded > 0 || event.type === 'GIFT')) {
        emitSessionLists();
      }
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
    if (status.state === 'CONNECTED' && autoSimulationEnabled) setAutoSimulationEnabled(false);
    io.emit('connection:status', status);
  });
  tiktok.on('error-safe', (message) => io.emit('system:error', { message }));
  youtube.on('event', (event: LiveEvent) => publish(event));
  youtube.on('status', (status) => {
    if (status.state === 'CONNECTED' && autoSimulationEnabled) setAutoSimulationEnabled(false);
    io.emit('platform:status', { platform: 'YOUTUBE', status });
  });
  youtube.on('error-safe', (message) =>
    io.emit('system:error', { message: `YouTube: ${message}` }),
  );
  facebook.on('event', (event: LiveEvent) => publish(event));
  facebook.on('status', (status) => {
    if (status.state === 'CONNECTED' && autoSimulationEnabled) setAutoSimulationEnabled(false);
    io.emit('platform:status', { platform: 'FACEBOOK', status });
  });
  facebook.on('error-safe', (message) =>
    io.emit('system:error', { message: `Facebook: ${message}` }),
  );

  io.on('connection', (socket) => {
    const characters = characterStore ? characterStore.getRealCharacters() : [];

    socket.emit('snapshot', {
      connection: tiktok.status,
      connections: {
        TIKTOK: tiktok.status,
        YOUTUBE: youtube.status,
        FACEBOOK: facebook.status,
      },
      events: events.recent(),
      stats: events.stats.snapshot(),
      game: { paused: gamePaused },
      simulation: { autoEnabled: autoSimulationEnabled },
      sessionLists: liveSessionLists.snapshot(),
      characters,
    });

    socket.on('state:request', (_v, ack) => {
      const currentCharacters = characterStore ? characterStore.getRealCharacters() : [];

      ack?.({
        success: true,
        data: {
          connection: tiktok.status,
          connections: {
            TIKTOK: tiktok.status,
            YOUTUBE: youtube.status,
            FACEBOOK: facebook.status,
          },
          events: events.recent(),
          stats: events.stats.snapshot(),
          game: { paused: gamePaused },
          simulation: { autoEnabled: autoSimulationEnabled },
          sessionLists: liveSessionLists.snapshot(),
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
        liveSessionLists.reset();
        emitSessionLists();
        ack?.({ success: true });
      } catch (e) {
        ack?.({ success: false, error: e instanceof Error ? e.message : String(e) });
      }
    });

    socket.on('tiktok:disconnect', async (_v, ack) => {
      await tiktok.disconnect();
      ack?.({ success: true });
    });

    socket.on('youtube:connect', async (input, ack) => {
      const parsedInput = liveUrlSchema.safeParse(input);
      if (!parsedInput.success) {
        return ack?.({ success: false, error: parsedInput.error.issues[0]?.message });
      }
      try {
        await youtube.connect(parsedInput.data.url);
        ack?.({ success: true });
      } catch (error) {
        ack?.({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    socket.on('youtube:disconnect', async (_input, ack) => {
      await youtube.disconnect();
      ack?.({ success: true });
    });

    socket.on('facebook:connect', async (input, ack) => {
      const parsedInput = liveUrlSchema.safeParse(input);
      if (!parsedInput.success) {
        return ack?.({ success: false, error: parsedInput.error.issues[0]?.message });
      }
      try {
        await facebook.connect(parsedInput.data.url);
        ack?.({ success: true });
      } catch (error) {
        ack?.({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    socket.on('facebook:disconnect', async (_input, ack) => {
      await facebook.disconnect();
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
        input?.source === 'SIMULATOR' ||
          input?.source === 'TIKTOK' ||
          input?.source === 'YOUTUBE' ||
          input?.source === 'FACEBOOK'
          ? input.source
          : undefined,
      );
      io.emit('stats:update', events.stats.snapshot());
      io.emit('events:reset', { source: input?.source });
      liveSessionLists.reset();
      emitSessionLists();
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
        liveSessionLists.recordMerit(result.character, result.pointsAwarded, 'TIKTOK');
        emitSessionLists();
      }
    }
  }, 10_000);
  watchTimeInterval.unref();
}
