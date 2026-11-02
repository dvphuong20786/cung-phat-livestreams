import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { EventService } from './services/EventService.js';
import { EventStore, getDefaultEventDatabasePath } from './services/EventStore.js';
import { CharacterStore } from './services/CharacterStore.js';
import { TikTokConnector } from './connectors/TikTokConnector.js';
import { EulerCloudConnector, getEulerApiKey } from './connectors/EulerCloudConnector.js';
import { setupSockets } from './socket/socketServer.js';

const port = Number(process.env.SERVER_PORT || 3001);
const origin = process.env.WEB_ORIGIN || 'http://localhost:5173';
const connectionMode = process.env.TIKTOK_CONNECTION_MODE === 'direct' ? 'direct' : 'cloud';
const databasePath = process.env.EVENT_DB_PATH?.trim() || getDefaultEventDatabasePath();
const retentionDays = Number(process.env.EVENT_RETENTION_DAYS || 30);

const eventStore = new EventStore(databasePath, retentionDays);
const characterStore = new CharacterStore(databasePath);

const app = express();
app.use(cors({ origin }));
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_q, r) =>
  r.json({
    ok: true,
    service: 'TikTok LIVE Monitor',
    tiktokConnectionMode: connectionMode,
    eulerApiKeyConfigured: Boolean(getEulerApiKey()),
    tiktokSignConfigured: Boolean(process.env.TIKTOK_SIGN_API_KEY?.trim()),
    persistence: {
      enabled: true,
      eventCount: eventStore.count(),
      retentionDays,
    },
    timestamp: Date.now(),
  }),
);

app.get('/api/characters', (_q, r) => {
  r.json({ ok: true, data: characterStore.getAllCharacters() });
});

app.get('/api/characters/:userId', (q, r) => {
  const char = characterStore.getCharacter(q.params.userId);
  if (!char) return r.status(404).json({ ok: false, error: 'Character not found' });
  r.json({ ok: true, data: char });
});

const http = createServer(app);
const io = new Server(http, { cors: { origin, methods: ['GET', 'POST'] } });

const events = new EventService(500, eventStore);
const tiktok = connectionMode === 'direct' ? new TikTokConnector() : new EulerCloudConnector();

setupSockets(io, events, tiktok, characterStore);

http.listen(port, '127.0.0.1', () =>
  console.log(`API + Socket.IO: http://localhost:${port} (${connectionMode}, SQLite)`),
);

async function shutdown() {
  await tiktok.disconnect();
  eventStore.close();
  characterStore.close();
  io.close();
  http.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
