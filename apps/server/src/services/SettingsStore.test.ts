import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsStore } from './SettingsStore.js';

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    store = new SettingsStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  it('lưu và lấy cài đặt đơn lẻ', () => {
    store.set('commentDurationSeconds', 15);
    expect(store.get('commentDurationSeconds')).toBe(15);
    expect(store.get('nonExistent', 10)).toBe(10);
  });

  it('lưu và lấy nhiều cài đặt cùng lúc', () => {
    store.setAll({
      simulatedVisitorIntervalSeconds: 8,
      mobile2dQueueEnabled: true,
      mobile2dBusySeatSeconds: 25,
    });

    const all = store.getAll();
    expect(all.simulatedVisitorIntervalSeconds).toBe(8);
    expect(all.mobile2dQueueEnabled).toBe(true);
    expect(all.mobile2dBusySeatSeconds).toBe(25);
  });
});

