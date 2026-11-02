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
  beforeEach(() => {
    useTempleGameStore.getState().clear();
    useTempleGameStore.setState({ userInteractions: {}, characterList: [] });
  });
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
  it('keeps accumulating offline merit points for repeated likes', () => {
    useTempleGameStore.getState().enqueue({ ...action(1), eventType: 'LIKE' });
    const firstPoints = useTempleGameStore.getState().userInteractions['u-1'];

    useTempleGameStore.getState().enqueue({
      ...action(2),
      userId: 'u-1',
      eventType: 'LIKE',
    });

    expect(useTempleGameStore.getState().userInteractions['u-1']).toBeGreaterThan(firstPoints);
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
  it('keeps persistent character points when clearing the temple scene', () => {
    useTempleGameStore.getState().syncCharacters([{ userId: 'u-1', meritPoints: 1250 }]);

    useTempleGameStore.getState().clear();

    expect(useTempleGameStore.getState().userInteractions['u-1']).toBe(1250);
    expect(useTempleGameStore.getState().characterList[0]?.meritPoints).toBe(1250);
  });
  it('allocates front row seats first until full, then allocates second row seats', () => {
    // 12 người đầu tiên phải được xếp vào hàng đầu (seatIndex 0..11)
    for (let i = 0; i < 12; i++) {
      useTempleGameStore.getState().enqueue(action(i));
    }
    const seated = useTempleGameStore.getState().seatedVisitors;
    for (let i = 0; i < 12; i++) {
      const visitor = seated.find((v) => v.userId === `u-${i}`);
      expect(visitor?.seatIndex).toBeDefined();
      expect(visitor!.seatIndex!).toBeGreaterThanOrEqual(0);
      expect(visitor!.seatIndex!).toBeLessThan(12);
    }

    // Người thứ 13 phải được xếp vào hàng 2 (seatIndex 12..23) vì hàng đầu đã đầy
    useTempleGameStore.getState().enqueue(action(12));
    const visitor13 = useTempleGameStore.getState().seatedVisitors.find((v) => v.userId === 'u-12');
    expect(visitor13?.seatIndex).toBeDefined();
    expect(visitor13!.seatIndex!).toBeGreaterThanOrEqual(12);
    expect(visitor13!.seatIndex!).toBeLessThan(24);
  });

  it('preserves assigned seat for the same user on repeated interactions', () => {
    useTempleGameStore.getState().enqueue(action(1));
    const initialSeat = useTempleGameStore.getState().seatedVisitors.find((v) => v.userId === 'u-1')?.seatIndex;
    expect(initialSeat).toBeDefined();

    // Người đó tương tác tiếp
    useTempleGameStore.getState().enqueue({ ...action(1), eventType: 'LIKE' });
    const updatedSeat = useTempleGameStore.getState().seatedVisitors.find((v) => v.userId === 'u-1')?.seatIndex;
    expect(updatedSeat).toBe(initialSeat);
  });
});