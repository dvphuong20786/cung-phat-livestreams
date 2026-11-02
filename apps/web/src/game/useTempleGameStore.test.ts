import { beforeEach, describe, expect, it } from 'vitest';
import type { TempleGameAction } from '@live/shared';
import { useTempleGameStore } from './useTempleGameStore';
const action = (
  index: number,
  type: TempleGameAction['actionType'] = 'ENTER_TEMPLE',
): TempleGameAction => ({
  actionId: `a-${index}`,
  userId: `u-${index}`,
  username: `user_${index}`,
  nickname: `Khán giả ${index}`,
  actionType: type,
  createdAt: index,
});
describe('temple game queue', () => {
  beforeEach(() => useTempleGameStore.getState().clear());
  it('bounds active characters and waiting queue during a burst', () => {
    for (let index = 0; index < 600; index++) useTempleGameStore.getState().enqueue(action(index));
    expect(useTempleGameStore.getState().active).toHaveLength(12);
    expect(useTempleGameStore.getState().queue).toHaveLength(500);
    expect(useTempleGameStore.getState().seatedVisitors).toHaveLength(80);
  });
  it('keeps one seat for repeated actions from the same viewer', () => {
    useTempleGameStore.getState().enqueue(action(1));
    useTempleGameStore.getState().enqueue({ ...action(2, 'OFFER_FLOWERS'), userId: 'u-1' });
    expect(useTempleGameStore.getState().seatedVisitors).toHaveLength(1);
  });
  it('prioritizes a flower ceremony in the waiting queue', () => {
    for (let index = 0; index < 12; index++) useTempleGameStore.getState().enqueue(action(index));
    useTempleGameStore.getState().enqueue(action(99, 'OFFER_FLOWERS'));
    expect(useTempleGameStore.getState().queue[0].actionType).toBe('OFFER_FLOWERS');
  });
  it('enqueues viewer-only join events so they walk directly to seat', () => {
    useTempleGameStore.getState().enqueue({ ...action(1), eventType: 'JOIN' });
    expect(useTempleGameStore.getState().seatedVisitors).toHaveLength(1);
    expect(useTempleGameStore.getState().active).toHaveLength(1);
  });
  it('syncs merit points from database correctly', () => {
    useTempleGameStore.getState().syncCharacters([
      { userId: 'u-1', meritPoints: 1250 },
      { userId: 'u-2', meritPoints: 17500 },
    ]);
    expect(useTempleGameStore.getState().userInteractions['u-1']).toBe(1250);
    expect(useTempleGameStore.getState().userInteractions['u-2']).toBe(17500);
  });
});
