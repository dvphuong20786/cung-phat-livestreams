import Database from 'better-sqlite3';
import { getDefaultEventDatabasePath } from './EventStore.js';
import type { LiveEvent, TempleGameAction } from '@live/shared';

export interface UserCharacter {
  userId: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  gender: 'male' | 'female';
  meritPoints: number;
  level: number;
  rankName: string;
  likePointsToday: number;
  lastCommentAt: number;
  shareCountToday: number;
  followAwarded: number;
  joinAwardedToday: number;
  watchTimeAwardedToday: number;
  lastActiveAt: number;
  createdAt: number;
}

export interface LevelMilestone {
  level: number;
  points: number;
  unlockTitle: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, points: 0, unlockTitle: 'Nhận nhân vật Khách hành hương' },
  { level: 5, points: 60, unlockTitle: 'Mở động tác chắp tay' },
  { level: 10, points: 180, unlockTitle: 'Mở hiệu ứng chuẩn bị thăng cấp' },
  { level: 11, points: 200, unlockTitle: 'Thăng cấp thành Phật tử' },
  { level: 15, points: 400, unlockTitle: 'Mở động tác quỳ lễ' },
  { level: 20, points: 650, unlockTitle: 'Nhận tràng hạt' },
  { level: 25, points: 950, unlockTitle: 'Mở hiệu ứng chuyển thành Cư sĩ' },
  { level: 26, points: 1000, unlockTitle: 'Thăng cấp thành Cư sĩ' },
  { level: 30, points: 1400, unlockTitle: 'Đổi trang phục nâu' },
  { level: 35, points: 1900, unlockTitle: 'Mở động tác tụng kinh' },
  { level: 40, points: 2400, unlockTitle: 'Mở nghi thức xuất gia' },
  { level: 41, points: 2500, unlockTitle: 'Thăng cấp thành Sa di/Sa di ni' },
  { level: 50, points: 4000, unlockTitle: 'Mở động tác thiền' },
  { level: 60, points: 5900, unlockTitle: 'Mở hiệu ứng thọ giới' },
  { level: 61, points: 6000, unlockTitle: 'Thăng cấp thành Tỳ kheo/Tỳ kheo ni' },
  { level: 70, points: 8500, unlockTitle: 'Mở pháp phục nâng cao' },
  { level: 80, points: 11800, unlockTitle: 'Mở thử thách Trụ trì' },
  { level: 81, points: 12000, unlockTitle: 'Thăng cấp thành Trụ trì' },
  { level: 90, points: 17000, unlockTitle: 'Mở hào quang' },
  { level: 100, points: 25000, unlockTitle: 'Mở danh hiệu và trang phục tối thượng' },
];

export function calculateLevelFromPoints(points: number): number {
  if (points <= 0) return 1;
  if (points >= 25000) return 100;

  for (let i = 0; i < LEVEL_MILESTONES.length - 1; i++) {
    const current = LEVEL_MILESTONES[i];
    const next = LEVEL_MILESTONES[i + 1];

    if (points >= current.points && points <= next.points) {
      const span = next.points - current.points;
      if (span <= 0) return current.level;
      const progress = (points - current.points) / span;
      return Math.min(next.level, Math.floor(current.level + progress * (next.level - current.level)));
    }
  }

  return 100;
}

export function getRankName(level: number, isFemale = false): string {
  if (level >= 81) return 'Trụ trì';
  if (level >= 61) return isFemale ? 'Tỳ kheo ni' : 'Tỳ kheo';
  if (level >= 41) return isFemale ? 'Sa di ni' : 'Sa di';
  if (level >= 26) return 'Cư sĩ';
  if (level >= 11) return 'Phật tử';
  return 'Khách hành hương';
}

export class CharacterStore {
  private readonly database: Database.Database;

  constructor(databasePath = getDefaultEventDatabasePath()) {
    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS user_characters (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        nickname TEXT NOT NULL,
        avatar_url TEXT,
        gender TEXT DEFAULT 'female',
        merit_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank_name TEXT DEFAULT 'Khách hành hương',
        like_points_today INTEGER DEFAULT 0,
        last_comment_at INTEGER DEFAULT 0,
        share_count_today INTEGER DEFAULT 0,
        follow_awarded INTEGER DEFAULT 0,
        join_awarded_today INTEGER DEFAULT 0,
        watch_time_awarded_today INTEGER DEFAULT 0,
        last_active_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_characters_merit ON user_characters(merit_points DESC);
    `);
  }

  public getCharacter(userId: string): UserCharacter | null {
    const row = this.database
      .prepare('SELECT * FROM user_characters WHERE user_id = ?')
      .get(userId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getAllCharacters(): UserCharacter[] {
    const rows = this.database
      .prepare('SELECT * FROM user_characters ORDER BY merit_points DESC LIMIT 200')
      .all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public resetLiveSessionLimits(): void {
    // Tổng điểm, level, cấp bậc và trạng thái FOLLOW được giữ vĩnh viễn.
    // Chỉ các giới hạn kiếm điểm theo từng buổi live được bắt đầu lại.
    this.database
      .prepare(`
        UPDATE user_characters SET
          like_points_today = 0,
          last_comment_at = 0,
          share_count_today = 0,
          join_awarded_today = 0,
          watch_time_awarded_today = 0
      `)
      .run();
  }

  public awardPointsForEvent(event: LiveEvent): { character: UserCharacter; pointsAwarded: number } {
    const userId = event.user.id || event.user.username;
    const username = event.user.username;
    const nickname = event.user.nickname || username;
    const avatarUrl = event.user.avatarUrl || '';
    const now = Date.now();

    const isFemale = (userId.charCodeAt(0) || 0) % 12 !== 0;
    const gender = isFemale ? 'female' : 'male';

    let character = this.getCharacter(userId);
    if (!character) {
      character = {
        userId,
        username,
        nickname,
        avatarUrl,
        gender,
        meritPoints: 0,
        level: 1,
        rankName: getRankName(1, isFemale),
        likePointsToday: 0,
        lastCommentAt: 0,
        shareCountToday: 0,
        followAwarded: 0,
        joinAwardedToday: 0,
        watchTimeAwardedToday: 0,
        lastActiveAt: now,
        createdAt: now,
      };
      this.insertCharacter(character);
    }

    let pointsAwarded = 0;

    switch (event.type) {
      case 'LIKE': {
        // 10 lượt like = +1 điểm (tối đa 50 điểm/buổi)
        const likes = Math.max(1, event.likeCount ?? 1);
        const calculatedPoints = Math.max(1, Math.floor(likes / 10));
        const remainingQuota = Math.max(0, 50 - character.likePointsToday);
        pointsAwarded = Math.min(calculatedPoints, remainingQuota);
        character.likePointsToday += pointsAwarded;
        break;
      }

      case 'COMMENT': {
        // Comment hợp lệ: +2 điểm (30s mới tính tiếp)
        if (now - character.lastCommentAt >= 30_000) {
          pointsAwarded = 2;
          character.lastCommentAt = now;
        }
        break;
      }

      case 'SHARE': {
        // Share livestream: +10 điểm (tối đa 3 lần/buổi)
        if (character.shareCountToday < 3) {
          pointsAwarded = 10;
          character.shareCountToday += 1;
        }
        break;
      }

      case 'FOLLOW': {
        // Follow kênh: +30 điểm (chỉ nhận một lần)
        if (character.followAwarded === 0) {
          pointsAwarded = 30;
          character.followAwarded = 1;
        }
        break;
      }

      case 'JOIN': {
        // Người xem mới tham gia live: +1 điểm (một lần/buổi)
        if (character.joinAwardedToday === 0) {
          pointsAwarded = 1;
          character.joinAwardedToday = 1;
        }
        break;
      }

      case 'GIFT': {
        const giftName = event.gift?.name ?? '';
        const quantity = Math.max(1, event.gift?.quantity ?? 1);
        const isFlower = /hoa|rose/i.test(giftName);

        if (isFlower) {
          // Tặng Hoa/Hoa hồng: +5 điểm (tính theo từng quà)
          pointsAwarded = quantity * 5;
        } else {
          // Bậc coin quà:
          const coins = quantity;
          if (coins >= 500) pointsAwarded = 200;
          else if (coins >= 100) pointsAwarded = 80;
          else if (coins >= 50) pointsAwarded = 30;
          else if (coins >= 10) pointsAwarded = 15;
          else pointsAwarded = 5;
        }
        break;
      }
    }

    if (pointsAwarded > 0) {
      character.meritPoints += pointsAwarded;
      character.level = calculateLevelFromPoints(character.meritPoints);
      character.rankName = getRankName(character.level, isFemale);
    }

    character.username = username;
    character.nickname = nickname;
    if (avatarUrl) character.avatarUrl = avatarUrl;
    character.lastActiveAt = now;

    this.updateCharacter(character);

    return { character, pointsAwarded };
  }

  private insertCharacter(char: UserCharacter): void {
    const stmt = this.database.prepare(`
      INSERT OR REPLACE INTO user_characters (
        user_id, username, nickname, avatar_url, gender,
        merit_points, level, rank_name, like_points_today,
        last_comment_at, share_count_today, follow_awarded,
        join_awarded_today, watch_time_awarded_today,
        last_active_at, created_at
      ) VALUES (
        @userId, @username, @nickname, @avatarUrl, @gender,
        @meritPoints, @level, @rankName, @likePointsToday,
        @lastCommentAt, @shareCountToday, @followAwarded,
        @joinAwardedToday, @watchTimeAwardedToday,
        @lastActiveAt, @createdAt
      )
    `);
    stmt.run({
      userId: char.userId,
      username: char.username,
      nickname: char.nickname,
      avatarUrl: char.avatarUrl ?? '',
      gender: char.gender,
      meritPoints: char.meritPoints,
      level: char.level,
      rankName: char.rankName,
      likePointsToday: char.likePointsToday,
      lastCommentAt: char.lastCommentAt,
      shareCountToday: char.shareCountToday,
      followAwarded: char.followAwarded,
      joinAwardedToday: char.joinAwardedToday,
      watchTimeAwardedToday: char.watchTimeAwardedToday,
      lastActiveAt: char.lastActiveAt,
      createdAt: char.createdAt,
    });
  }

  private updateCharacter(char: UserCharacter): void {
    const stmt = this.database.prepare(`
      UPDATE user_characters SET
        username = @username,
        nickname = @nickname,
        avatar_url = @avatarUrl,
        merit_points = @meritPoints,
        level = @level,
        rank_name = @rankName,
        like_points_today = @likePointsToday,
        last_comment_at = @lastCommentAt,
        share_count_today = @shareCountToday,
        follow_awarded = @followAwarded,
        join_awarded_today = @joinAwardedToday,
        watch_time_awarded_today = @watchTimeAwardedToday,
        last_active_at = @lastActiveAt
      WHERE user_id = @userId
    `);
    stmt.run({
      userId: char.userId,
      username: char.username,
      nickname: char.nickname,
      avatarUrl: char.avatarUrl ?? '',
      meritPoints: char.meritPoints,
      level: char.level,
      rankName: char.rankName,
      likePointsToday: char.likePointsToday,
      lastCommentAt: char.lastCommentAt,
      shareCountToday: char.shareCountToday,
      followAwarded: char.followAwarded,
      joinAwardedToday: char.joinAwardedToday,
      watchTimeAwardedToday: char.watchTimeAwardedToday,
      lastActiveAt: char.lastActiveAt,
    });
  }

  private mapRow(row: any): UserCharacter {
    return {
      userId: row.user_id,
      username: row.username,
      nickname: row.nickname,
      avatarUrl: row.avatar_url || undefined,
      gender: row.gender === 'male' ? 'male' : 'female',
      meritPoints: row.merit_points,
      level: row.level,
      rankName: row.rank_name,
      likePointsToday: row.like_points_today,
      lastCommentAt: row.last_comment_at,
      shareCountToday: row.share_count_today,
      followAwarded: row.follow_awarded,
      joinAwardedToday: row.join_awarded_today,
      watchTimeAwardedToday: row.watch_time_awarded_today,
      lastActiveAt: row.last_active_at,
      createdAt: row.created_at,
    };
  }

  public close(): void {
    this.database.close();
  }
}

