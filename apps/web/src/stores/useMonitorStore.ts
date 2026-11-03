import { create } from 'zustand';
import type {
  ConnectionStatus,
  EventSource,
  LiveEvent,
  RealEventSource,
  Snapshot,
  Statistics,
} from '@live/shared';

const emptyStats = {
  likes: 0,
  giftQuantity: 0,
  giftEvents: 0,
  comments: 0,
  follows: 0,
  shares: 0,
  joins: 0,
  uniqueUsers: 0,
  eventRate: 0,
};
const initialStats: Statistics = {
  total: { ...emptyStats },
  real: { ...emptyStats },
  simulated: { ...emptyStats },
};
type MonitorPreferences = {
  autoReconnect: boolean;
  likeWindow: number;
  maxEvents: number;
  joinEvents: boolean;
  debug: boolean;
  display: 'ALL' | 'REAL' | EventSource;
  commentDurationSeconds: number;
  mobile2dQueueEnabled: boolean;
  mobile2dBusySeatSeconds: number;
  mobile2dPrayerSeconds: number;
  mobile2dDonationBowSeconds: number;
  mobile2dFlowerOfferingSeconds: number;
  mobile2dWalkInSeconds: number;
  mobile2dWalkToSeatSeconds: number;
};
const defaultPreferences: MonitorPreferences = {
  autoReconnect: true,
  likeWindow: 500,
  maxEvents: 500,
  joinEvents: true,
  debug: false,
  display: 'ALL',
  commentDurationSeconds: 20,
  mobile2dQueueEnabled: true,
  mobile2dBusySeatSeconds: 20,
  mobile2dPrayerSeconds: 3,
  mobile2dDonationBowSeconds: 5,
  mobile2dFlowerOfferingSeconds: 3.5,
  mobile2dWalkInSeconds: 2.6,
  mobile2dWalkToSeatSeconds: 2.4,
};
function loadStoredPreferences(): Partial<MonitorPreferences> {
  try {
    return JSON.parse(localStorage.getItem('live-monitor-prefs') || '{}');
  } catch {
    return {};
  }
}
interface MonitorStore {
  events: LiveEvent[];
  stats: Statistics;
  connection: ConnectionStatus;
  connections: Record<RealEventSource, ConnectionStatus>;
  socketConnected: boolean;
  autoSimulationEnabled: boolean;
  error?: string;
  prefs: MonitorPreferences;
  hydrate: (snapshot: Snapshot) => void;
  addEvent: (event: LiveEvent) => void;
  setStats: (stats: Statistics) => void;
  setConnection: (connection: ConnectionStatus) => void;
  setPlatformConnection: (platform: RealEventSource, connection: ConnectionStatus) => void;
  setSocketConnected: (connected: boolean) => void;
  setAutoSimulationEnabled: (enabled: boolean) => void;
  setError: (error?: string) => void;
  resetEvents: (source?: string) => void;
  setPrefs: (preferences: Partial<MonitorPreferences>) => void;
}
export const useMonitorStore = create<MonitorStore>((set, get) => ({
  events: [],
  stats: initialStats,
  connection: { state: 'DISCONNECTED', reconnectAttempt: 0 },
  connections: {
    TIKTOK: { state: 'DISCONNECTED', reconnectAttempt: 0 },
    YOUTUBE: { state: 'DISCONNECTED', reconnectAttempt: 0 },
    FACEBOOK: { state: 'DISCONNECTED', reconnectAttempt: 0 },
  },
  socketConnected: false,
  autoSimulationEnabled: false,
  prefs: { ...defaultPreferences, ...loadStoredPreferences() },
  hydrate: (snapshot) =>
    set({
      events: snapshot.events,
      stats: snapshot.stats,
      connection: snapshot.connection,
      connections: snapshot.connections ?? {
        TIKTOK: snapshot.connection,
        YOUTUBE: { state: 'DISCONNECTED', reconnectAttempt: 0 },
        FACEBOOK: { state: 'DISCONNECTED', reconnectAttempt: 0 },
      },
      autoSimulationEnabled: snapshot.simulation?.autoEnabled ?? false,
    }),
  addEvent: (event) => set({ events: [event, ...get().events].slice(0, get().prefs.maxEvents) }),
  setStats: (stats) => set({ stats }),
  setConnection: (connection) =>
    set((state) => ({
      connection,
      connections: { ...state.connections, TIKTOK: connection },
    })),
  setPlatformConnection: (platform, connection) =>
    set((state) => ({ connections: { ...state.connections, [platform]: connection } })),
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setAutoSimulationEnabled: (autoSimulationEnabled) => set({ autoSimulationEnabled }),
  setError: (error) => set({ error }),
  resetEvents: (source) =>
    set({ events: source ? get().events.filter((event) => event.source !== source) : [] }),
  setPrefs: (preferences) => {
    const prefs = { ...get().prefs, ...preferences };
    localStorage.setItem('live-monitor-prefs', JSON.stringify(prefs));
    set({ prefs });
  },
}));

// Đồng bộ cài đặt giữa trang Admin và cửa sổ overlay/OBS đang mở ở tab khác.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'live-monitor-prefs') return;
    useMonitorStore.setState({
      prefs: { ...defaultPreferences, ...loadStoredPreferences() },
    });
  });
}
