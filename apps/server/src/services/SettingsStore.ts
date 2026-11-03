import Database from 'better-sqlite3';
import { getDefaultEventDatabasePath } from './EventStore.js';

export class SettingsStore {
  private readonly database: Database.Database;
  private readonly getStatement: Database.Statement;
  private readonly setStatement: Database.Statement;

  constructor(databasePath = getDefaultEventDatabasePath()) {
    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.getStatement = this.database.prepare(
      'SELECT value_json FROM system_settings WHERE key = ?',
    );
    this.setStatement = this.database.prepare(
      'INSERT OR REPLACE INTO system_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
    );
  }

  get<T = unknown>(key: string, fallback?: T): T | undefined {
    const row = this.getStatement.get(key) as { value_json: string } | undefined;
    if (!row) return fallback;
    try {
      return JSON.parse(row.value_json) as T;
    } catch {
      return fallback;
    }
  }

  set(key: string, value: unknown): void {
    this.setStatement.run(key, JSON.stringify(value), Date.now());
  }

  getAll(): Record<string, unknown> {
    const rows = this.database.prepare('SELECT key, value_json FROM system_settings').all() as Array<{
      key: string;
      value_json: string;
    }>;
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value_json);
      } catch {
        // bỏ qua nếu parse lỗi
      }
    }
    return result;
  }

  setAll(settings: Record<string, unknown>): void {
    const transaction = this.database.transaction((entries: [string, unknown][]) => {
      const now = Date.now();
      for (const [key, value] of entries) {
        this.setStatement.run(key, JSON.stringify(value), now);
      }
    });
    transaction(Object.entries(settings));
  }

  close(): void {
    this.database.close();
  }
}

