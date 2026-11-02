import type { TempleGameAction } from '@live/shared';

export function calculateSeatingDuration(
  visitor: TempleGameAction,
  userInteractionPoints: number,
): number {
  const isDonation =
    visitor.eventType === 'GIFT' ||
    visitor.actionType === 'OFFER_FLOWERS' ||
    visitor.actionType === 'OFFER_INCENSE';
  if (!isDonation) return 2 * 60_000;

  const level = Math.min(100, Math.floor(userInteractionPoints / 10));
  const giftCount = visitor.quantity ?? 1;
  const extraSeconds = Math.min(180, level * 2 + Math.min(60, giftCount * 2));
  return 4 * 60_000 + extraSeconds * 1000;
}
