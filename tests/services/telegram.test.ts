// Mock pg before importing telegram service
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { sendMessage, startBot } from '../../src/services/telegram';
import { Telegraf } from 'telegraf';

// Mock telegraf
jest.mock('telegraf');
const MockedTelegraf = Telegraf as jest.MockedClass<typeof Telegraf>;

describe('Telegram Service', () => {
  let mockBot: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock bot instance
    mockBot = {
      command: jest.fn(),
      on: jest.fn(),
      launch: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      catch: jest.fn(),
      telegram: {
        sendMessage: jest.fn().mockResolvedValue(undefined),
      },
    };

    MockedTelegraf.mockImplementation(() => mockBot);
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const message = 'Test message';
      const chatId = '123456789';

      process.env.TELEGRAM_CHAT_ID = chatId;

      await sendMessage(message);

      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        message,
        expect.any(Object)
      );
    });

    it('should handle missing chat ID', async () => {
      delete process.env.TELEGRAM_CHAT_ID;

      // Should not throw error, just log
      await expect(sendMessage('Test message')).resolves.toBeUndefined();
    });

    it('should handle Telegram API errors', async () => {
      const error = new Error('Telegram API Error');
      mockBot.telegram.sendMessage.mockRejectedValueOnce(error);

      const chatId = '123456789';
      process.env.TELEGRAM_CHAT_ID = chatId;

      // Should not throw error, just log
      await expect(sendMessage('Test message')).resolves.toBeUndefined();
    });
  });

  describe('startBot', () => {
    it('should start bot successfully', async () => {
      const chatId = '123456789';
      process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
      process.env.TELEGRAM_CHAT_ID = chatId;

      await startBot();

      expect(MockedTelegraf).toHaveBeenCalledWith('mock-token');
      expect(mockBot.launch).toHaveBeenCalled();
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '🔔 Bot restarted and ready!'
      );
    });

    it('should handle bot launch errors', async () => {
      const error = new Error('Launch failed');
      mockBot.launch.mockRejectedValueOnce(error);

      process.env.TELEGRAM_BOT_TOKEN = 'mock-token';

      await expect(startBot()).rejects.toThrow('Launch failed');
    });

    it('should handle missing bot token', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      await expect(startBot()).rejects.toThrow();
    });
  });
});
