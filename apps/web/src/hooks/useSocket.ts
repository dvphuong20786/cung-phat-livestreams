import { useEffect } from 'react';
import { socket } from '../services/socket';
import { useMonitorStore } from '../stores/useMonitorStore';
import type { ConnectionStatus, LiveEvent, Snapshot, Statistics, TempleGameAction } from '@live/shared';
import { useTempleGameStore, type StoredCharacter } from '../game/useTempleGameStore';

export function useSocket() {
  useEffect(() => {
    const s = useMonitorStore.getState;
    const g = useTempleGameStore.getState;

    const connected = () => s().setSocketConnected(true);
    const disconnected = () => s().setSocketConnected(false);

    const snapshot = (
      v: Snapshot & {
        game?: { paused: boolean };
        characters?: Array<Partial<StoredCharacter> & { userId: string; meritPoints: number }>;
      },
    ) => {
      s().hydrate(v);
      if (v.game) g().setPaused(v.game.paused);
      if (v.characters && Array.isArray(v.characters)) {
        g().syncCharacters(v.characters);
      }
    };

    const event = (v: LiveEvent) => s().addEvent(v);
    const stats = (v: Statistics) => s().setStats(v);
    const status = (v: ConnectionStatus) => s().setConnection(v);
    const error = (v: { message: string }) => s().setError(v.message);
    const reset = (v: { source?: string }) => s().resetEvents(v.source);
    const gameAction = (v: TempleGameAction) => g().enqueue(v);
    const gameClear = () => g().clear();
    const gamePaused = (v: boolean) => g().setPaused(v);
    const characterUpdated = (
      c: Partial<StoredCharacter> & { userId: string; meritPoints: number },
    ) => {
      if (c && c.userId) {
        g().syncCharacters([c]);
      }
    };

    socket.on('connect', connected);
    socket.on('disconnect', disconnected);
    socket.on('snapshot', snapshot);
    socket.on('tiktok:event', event);
    socket.on('stats:update', stats);
    socket.on('connection:status', status);
    socket.on('system:error', error);
    socket.on('events:reset', reset);
    socket.on('game:action', gameAction);
    socket.on('game:clear', gameClear);
    socket.on('game:paused', gamePaused);
    socket.on('character:updated', characterUpdated);

    if (socket.connected) connected();

    return () => {
      socket.off('connect', connected);
      socket.off('disconnect', disconnected);
      socket.off('snapshot', snapshot);
      socket.off('tiktok:event', event);
      socket.off('stats:update', stats);
      socket.off('connection:status', status);
      socket.off('system:error', error);
      socket.off('events:reset', reset);
      socket.off('game:action', gameAction);
      socket.off('game:clear', gameClear);
      socket.off('game:paused', gamePaused);
      socket.off('character:updated', characterUpdated);
    };
  }, []);
}
