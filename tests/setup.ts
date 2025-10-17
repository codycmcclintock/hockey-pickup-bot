// Global test setup
import 'dotenv/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
process.env.TELEGRAM_CHAT_ID = '123456789';
process.env.API_URL = 'https://api.hockeypickup.com';
process.env.USER_EMAIL = 'test@example.com';
process.env.USER_PASSWORD = 'test-password';

// Global mocks
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('telegraf', () => {
  return {
    Telegraf: jest.fn().mockImplementation(() => ({
      command: jest.fn(),
      on: jest.fn(),
      hears: jest.fn(),
      launch: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      catch: jest.fn(),
      help: jest.fn(),
      telegram: {
        sendMessage: jest.fn().mockResolvedValue(undefined),
        setMyCommands: jest.fn().mockResolvedValue(undefined),
      },
    })),
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
