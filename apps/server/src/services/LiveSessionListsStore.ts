import type {
  LiveEvent,
  LiveSessionLists,
  RealEventSource,
  SessionDonorEntry,
  SessionMeritEntry,
} from '@live/shared';
import type { UserCharacter } from './CharacterStore.js';

export class LiveSessionListsStore {
  private readonly meritByUserId = new Map<string, SessionMeritEntry>();
  private readonly donorsByUserId = new Map<string, SessionDonorEntry>();

  public recordEvent(event: LiveEvent, character: UserCharacter, pointsAwarded: number): void {
    if (!isRealSource(event.source) || character.isSimulated) return;

    if (pointsAwarded > 0) {
      this.recordMerit(character, pointsAwarded, event.source);
    }

    if (event.type === 'GIFT' && event.gift) {
      const existingDonor = this.donorsByUserId.get(character.userId);
      this.donorsByUserId.set(character.userId, {
        userId: character.userId,
        nickname: character.nickname,
        avatarUrl: character.avatarUrl,
        giftName: event.gift.name,
        quantity: (existingDonor?.quantity ?? 0) + Math.max(1, event.gift.quantity),
        timestamp: event.timestamp,
        source: event.source,
      });
    }
  }

  public recordMerit(
    character: UserCharacter,
    pointsAwarded: number,
    source: RealEventSource,
  ): void {
    if (character.isSimulated || pointsAwarded <= 0) return;

    const existingEntry = this.meritByUserId.get(character.userId);
    this.meritByUserId.set(character.userId, {
      userId: character.userId,
      nickname: character.nickname,
      avatarUrl: character.avatarUrl,
      meritPoints: (existingEntry?.meritPoints ?? 0) + pointsAwarded,
      rankName: character.rankName,
      source,
    });
  }

  public snapshot(): LiveSessionLists {
    const merit = [...this.meritByUserId.values()]
      .sort((firstEntry, secondEntry) => secondEntry.meritPoints - firstEntry.meritPoints)
      .slice(0, 200);
    const donors = [...this.donorsByUserId.values()]
      .sort(
        (firstDonor, secondDonor) =>
          secondDonor.quantity - firstDonor.quantity ||
          secondDonor.timestamp - firstDonor.timestamp,
      )
      .slice(0, 50);
    return { merit, donors };
  }

  public reset(): void {
    this.meritByUserId.clear();
    this.donorsByUserId.clear();
  }
}

function isRealSource(source: LiveEvent['source']): source is RealEventSource {
  return source === 'TIKTOK' || source === 'YOUTUBE' || source === 'FACEBOOK';
}
