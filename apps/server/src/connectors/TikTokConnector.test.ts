import { describe, expect, it } from 'vitest';
import { getTikTokConnectionErrorMessage } from './TikTokConnector';
describe('TikTok connection errors', () => {
  const businessError = new Error(
    '[Empty Payload] [fetchWebcastSignatureFromEulerRoute] Failed: This endpoint requires a Business plan.',
  );
  it('explains when the API key is not loaded', () => {
    const message = getTikTokConnectionErrorMessage(businessError, false);
    expect(message).toContain('TIKTOK_SIGN_API_KEY');
    expect(message).toContain('chế độ giả lập');
  });
  it('explains when the loaded key lacks permission', () =>
    expect(getTikTokConnectionErrorMessage(businessError, true)).toContain('đã được server nạp'));
  it('translates an offline error', () =>
    expect(getTikTokConnectionErrorMessage(new Error('UserOfflineError'))).toContain(
      'không phát LIVE',
    ));
});
