import Database from 'better-sqlite3';
import { getDefaultEventDatabasePath } from './EventStore.js';
import type { LiveEvent, TempleGameAction } from '@live/shared';

export interface UserCharacter {
  userId: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  isSimulated: boolean;
  gender: 'male' | 'female';
  meritPoints: number;
  level: number;
  rankName: string;
  likeCountInSession: number;
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
      return Math.min(
        next.level,
        Math.floor(current.level + progress * (next.level - current.level)),
      );
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
        is_simulated INTEGER DEFAULT 0,
        gender TEXT DEFAULT 'female',
        merit_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank_name TEXT DEFAULT 'Khách hành hương',
        like_points_today INTEGER DEFAULT 0,
        like_count_in_session INTEGER DEFAULT 0,
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
    this.migrateSimulatedCharacters();
  }

  private migrateSimulatedCharacters(): void {
    const columns = this.database.prepare('PRAGMA table_info(user_characters)').all() as Array<{
      name: string;
    }>;
    if (!columns.some((column) => column.name === 'is_simulated')) {
      this.database.exec('ALTER TABLE user_characters ADD COLUMN is_simulated INTEGER DEFAULT 0');
    }
    if (!columns.some((column) => column.name === 'like_count_in_session')) {
      this.database.exec(
        'ALTER TABLE user_characters ADD COLUMN like_count_in_session INTEGER DEFAULT 0',
      );
    }

    this.database
      .prepare(
        `UPDATE user_characters
         SET is_simulated = 1
         WHERE user_id GLOB 'sim-*' OR username GLOB 'sim_*'`,
      )
      .run();

    const eventTable = this.database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'live_events'")
      .get();
    if (!eventTable) return;

    const eventRows = this.database
      .prepare('SELECT source, event_json FROM live_events')
      .all() as Array<{ source: string; event_json: string }>;
    const realIdentities = new Set<string>();
    const simulatedIdentities = new Set<string>();
    for (const eventRow of eventRows) {
      try {
        const event = JSON.parse(eventRow.event_json) as LiveEvent;
        const identities = [event.user.id, event.user.username]
          .filter((identity): identity is string => Boolean(identity))
          .map((identity) => identity.toLocaleLowerCase());
        const target = eventRow.source === 'SIMULATOR' ? simulatedIdentities : realIdentities;
        identities.forEach((identity) => target.add(identity));
      } catch {
        // Bỏ qua event lịch sử bị lỗi JSON, không thay đổi dữ liệu nhân vật.
      }
    }

    const markSimulatedCharacter = this.database.prepare(
      `UPDATE user_characters
       SET is_simulated = 1
       WHERE LOWER(user_id) = ? OR LOWER(username) = ?`,
    );
    for (const identity of simulatedIdentities) {
      if (!realIdentities.has(identity)) markSimulatedCharacter.run(identity, identity);
    }
  }

  public getCharacter(userId: string): UserCharacter | null {
    const row = this.database
      .prepare('SELECT * FROM user_characters WHERE user_id = ?')
      .get(userId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  private getCharacterByUsername(username: string): UserCharacter | null {
    if (!username || username === 'không rõ') return null;

    const row = this.database
      .prepare(
        `SELECT * FROM user_characters
         WHERE username = ? COLLATE NOCASE
         ORDER BY last_active_at DESC
         LIMIT 1`,
      )
      .get(username) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getAllCharacters(): UserCharacter[] {
    const rows = this.database
      .prepare('SELECT * FROM user_characters ORDER BY merit_points DESC LIMIT 200')
      .all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public getRealCharacters(): UserCharacter[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM user_characters
         WHERE is_simulated = 0
         ORDER BY merit_points DESC
         LIMIT 200`,
      )
      .all() as any[];
    return rows.map((row) => this.mapRow(row));
  }

  public resetLiveSessionLimits(): void {
    // Tổng điểm, level, cấp bậc và trạng thái FOLLOW được giữ vĩnh viễn.
    // Chỉ các giới hạn kiếm điểm theo từng buổi live được bắt đầu lại.
    this.database
      .prepare(
        `
        UPDATE user_characters SET
          like_points_today = 0,
          like_count_in_session = 0,
          last_comment_at = 0,
          share_count_today = 0,
          join_awarded_today = 0,
          watch_time_awarded_today = 0
      `,
      )
      .run();
  }

  public awardPointsForEvent(event: LiveEvent): {
    character: UserCharacter;
    pointsAwarded: number;
  } {
    const incomingUserId = event.user.id || event.user.username;
    const username = event.user.username;
    const nickname = event.user.nickname || username;
    const avatarUrl = event.user.avatarUrl || '';
    const now = Date.now();

    // TikTok đôi khi đổi dạng userId giữa JOIN và COMMENT nên cần đối chiếu thêm username.
    // YouTube/Facebook luôn dùng ID có tiền tố nền tảng để không gộp nhầm hai người trùng tên.
    let character = this.getCharacter(incomingUserId);
    if (!character && event.source === 'TIKTOK') {
      character = this.getCharacterByUsername(username);
    }
    const userId = character?.userId ?? incomingUserId;
    const isFemale = (userId.charCodeAt(0) || 0) % 12 !== 0;
    const gender = isFemale ? 'female' : 'male';

    if (!character) {
      character = {
        userId,
        username,
        nickname,
        avatarUrl,
        isSimulated: event.source === 'SIMULATOR',
        gender,
        meritPoints: 0,
        level: 1,
        rankName: getRankName(1, isFemale),
        likeCountInSession: 0,
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
        // Chỉ cộng điểm cho từng nhóm đủ 10 like; số like dư được giữ lại trong phiên.
        const likes = Math.max(1, event.likeCount ?? 1);
        const completedGroupsBefore = Math.floor(character.likeCountInSession / 10);
        character.likeCountInSession += likes;
        const completedGroupsAfter = Math.floor(character.likeCountInSession / 10);
        pointsAwarded = (completedGroupsAfter - completedGroupsBefore) * 3;
        break;
      }

      case 'COMMENT': {
        // Comment hợp lệ: +5 điểm (mỗi comment được tính điểm)
        pointsAwarded = 5;
        character.lastCommentAt = now;
        break;
      }

      case 'SHARE': {
        // Share livestream: +30 điểm (mỗi lần share đều được tính)
        pointsAwarded = 30;
        character.shareCountToday += 1;
        break;
      }

      case 'FOLLOW': {
        // Follow kênh: +100 điểm (chỉ cộng khi phát sinh follow mới)
        if (character.followAwarded === 0) {
          pointsAwarded = 100;
          character.followAwarded = 1;
        }
        break;
      }

      case 'JOIN': {
        // Tham gia livestream: +5 điểm (mỗi lần vào buổi livestream)
        if (character.joinAwardedToday === 0) {
          pointsAwarded = 5;
          character.joinAwardedToday = 1;
        }
        break;
      }

      case 'GIFT': {
        const giftName = event.gift?.name ?? '';
        const quantity = Math.max(1, event.gift?.quantity ?? 1);
        const isFlower = /hoa|rose/i.test(giftName);

        if (isFlower) {
          // Tặng Hoa/Hoa hồng: +10 điểm nhân với số lượng quà
          pointsAwarded = quantity * 10;
        } else {
          // Bậc coin quà: 1-9 coin (+15), 10-49 coin (+40), 50-99 coin (+100), 100-499 coin (+250), 500+ coin (+600)
          const singleCoin = event.gift?.coinValue ?? 1;
          let pointPerGift = 15;
          if (singleCoin >= 500) pointPerGift = 600;
          else if (singleCoin >= 100) pointPerGift = 250;
          else if (singleCoin >= 50) pointPerGift = 100;
          else if (singleCoin >= 10) pointPerGift = 40;
          else pointPerGift = 15;

          pointsAwarded = quantity * pointPerGift;
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
    // Một tài khoản từng giả lập nhưng sau đó xuất hiện từ TikTok thật được tính là người thật.
    if (event.source === 'TIKTOK') character.isSimulated = false;
    character.lastActiveAt = now;

    this.updateCharacter(character);

    return { character, pointsAwarded };
  }

  /**
   * Xem liên tục 5 phút: +20 điểm (cứ đủ 5 phút cộng tiếp 20 điểm)
   */
  public awardWatchTime(
    userId: string,
  ): { character: UserCharacter; pointsAwarded: number } | null {
    const character = this.getCharacter(userId);
    if (!character) return null;

    const pointsAwarded = 20;
    character.meritPoints += pointsAwarded;
    character.watchTimeAwardedToday += pointsAwarded;
    character.level = calculateLevelFromPoints(character.meritPoints);
    character.rankName = getRankName(character.level, character.gender === 'female');
    character.lastActiveAt = Date.now();

    this.updateCharacter(character);
    return { character, pointsAwarded };
  }

  private insertCharacter(char: UserCharacter): void {
    const stmt = this.database.prepare(`
      INSERT OR REPLACE INTO user_characters (
        user_id, username, nickname, avatar_url, is_simulated, gender,
        merit_points, level, rank_name, like_points_today,
        like_count_in_session,
        last_comment_at, share_count_today, follow_awarded,
        join_awarded_today, watch_time_awarded_today,
        last_active_at, created_at
      ) VALUES (
        @userId, @username, @nickname, @avatarUrl, @isSimulated, @gender,
        @meritPoints, @level, @rankName, 0,
        @likeCountInSession,
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
      isSimulated: char.isSimulated ? 1 : 0,
      gender: char.gender,
      meritPoints: char.meritPoints,
      level: char.level,
      rankName: char.rankName,
      likeCountInSession: char.likeCountInSession,
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
        is_simulated = @isSimulated,
        merit_points = @meritPoints,
        level = @level,
        rank_name = @rankName,
        like_count_in_session = @likeCountInSession,
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
      isSimulated: char.isSimulated ? 1 : 0,
      meritPoints: char.meritPoints,
      level: char.level,
      rankName: char.rankName,
      likeCountInSession: char.likeCountInSession,
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
      isSimulated: row.is_simulated === 1,
      gender: row.gender === 'male' ? 'male' : 'female',
      meritPoints: row.merit_points,
      level: row.level,
      rankName: row.rank_name,
      likeCountInSession: row.like_count_in_session ?? 0,
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
