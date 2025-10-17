// Simple working test for telegram service
import { sendMessage, startBot } from '../../src/services/telegram';

describe('Telegram Service - Simple Tests', () => {
  it('should be importable without errors', () => {
    expect(sendMessage).toBeDefined();
    expect(typeof sendMessage).toBe('function');
    expect(startBot).toBeDefined();
    expect(typeof startBot).toBe('function');
  });
});
