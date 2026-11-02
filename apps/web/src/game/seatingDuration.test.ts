import { describe, expect, it } from 'vitest';
import type { TempleGameAction } from '@live/shared';
import { calculateSeatingDuration } from './seatingDuration';

function createVisitor(actionType: TempleGameAction['actionType']): TempleGameAction {
  return {
    actionId: 'action-1',
    userId: 'user-1',
    username: 'phat_tu',
    nickname: 'Phật tử',
    actionType,
    createdAt: 1_000,
  };
}

describe('calculateSeatingDuration', () => {
  it('keeps ordinary visitors seated for two minutes', () => {
    expect(calculateSeatingDuration(createVisitor('ENTER_TEMPLE'), 0)).toBe(2 * 60_000);
  });

  it('uses the same extended duration for donation seat rendering and allocation', () => {
    const donor = createVisitor('OFFER_INCENSE');
    donor.quantity = 10;

    expect(calculateSeatingDuration(donor, 500)).toBe(4 * 60_000 + 120_000);
  });
});
