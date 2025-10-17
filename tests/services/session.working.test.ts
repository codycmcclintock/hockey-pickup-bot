// Working test for session service
// Mock all dependencies first
jest.mock('../../src/services/auth');
jest.mock('../../src/services/telegram');
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

import { getAllSessions, registerForSession, formatSessionMessage } from '../../src/services/session';
import { login } from '../../src/services/auth';
import { sendMessage } from '../../src/services/telegram';
import axios from 'axios';

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

// Get the mocked axios instance
const mockAxiosInstance = {
  post: jest.fn(),
};

const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('Session Service - Working Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatSessionMessage', () => {
    it('should format session message correctly', () => {
      const session = {
        SessionId: 1,
        SessionDate: '2024-01-15',
        Note: 'Regular session',
        BuyDayMinimum: 2,
        Cost: 25,
      };

      const result = formatSessionMessage(session);

      expect(result).toContain('Regular session');
      expect(result).toContain('$25');
      expect(result).toContain('2024-01-15');
    });

    it('should handle session with no note', () => {
      const session = {
        SessionId: 1,
        SessionDate: '2024-01-15',
        Note: '',
        BuyDayMinimum: 2,
        Cost: 25,
      };

      const result = formatSessionMessage(session);

      expect(result).toContain('No note');
    });
  });

  describe('getAllSessions', () => {
    it('should fetch all sessions successfully', async () => {
      const mockSessions = [
        {
          SessionId: 1,
          SessionDate: '2024-01-15',
          Note: 'Regular session',
          BuyDayMinimum: 2,
          Cost: 25,
        },
      ];

      const mockResponse = {
        data: {
          data: {
            Sessions: mockSessions,
          },
        },
      };

      mockedLogin.mockResolvedValue('mock-token');
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await getAllSessions();

      expect(result).toEqual(mockSessions);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          query: expect.stringContaining('Sessions'),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedLogin.mockResolvedValue('mock-token');
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const result = await getAllSessions();

      expect(result).toEqual([]);
    });
  });

  describe('registerForSession', () => {
    it('should register for session successfully', async () => {
      const sessionId = 123;
      const mockToken = 'mock-token';
      const mockResponse = {
        data: {
          Success: true,
          Message: 'Registration successful',
        },
        status: 200,
      };

      mockedLogin.mockResolvedValue(mockToken);
      mockedSendMessage.mockResolvedValue(undefined);
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      await registerForSession(sessionId);

      expect(mockedLogin).toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/BuySell/buy', { sessionId });
      expect(mockedSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('✅ Registration Successful!'),
        true
      );
    });

    it('should handle registration failure', async () => {
      const sessionId = 123;
      const mockToken = 'mock-token';
      const mockResponse = {
        data: {
          Success: false,
          Message: 'Session is full',
        },
        status: 400,
      };

      mockedLogin.mockResolvedValue(mockToken);
      mockedSendMessage.mockResolvedValue(undefined);
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      await registerForSession(sessionId);

      expect(mockedSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('❌ Registration Failed!'),
        true
      );
    });
  });
});
