import { getAllSessions, registerForSession, formatSessionMessage } from '../../src/services/session';
import { login } from '../../src/services/auth';
import { sendMessage } from '../../src/services/telegram';
import axios from 'axios';

// Mock dependencies
jest.mock('../../src/services/auth');
jest.mock('../../src/services/telegram');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

describe('Session Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        {
          SessionId: 2,
          SessionDate: '2024-01-17',
          Note: 'Friday session',
          BuyDayMinimum: 2,
          Cost: 30,
        },
      ];

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              sessions: mockSessions,
            },
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await getAllSessions();

      expect(result).toEqual(mockSessions);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          query: expect.stringContaining('sessions'),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockAxiosInstance = {
        post: jest.fn().mockRejectedValue(new Error('API Error')),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await expect(getAllSessions()).rejects.toThrow('API Error');
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

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await registerForSession(sessionId);

      expect(mockedLogin).toHaveBeenCalled();
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.hockeypickup.com',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
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

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await registerForSession(sessionId);

      expect(mockedSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('❌ Registration Failed!'),
        true
      );
    });

    it('should handle API errors during registration', async () => {
      const sessionId = 123;
      const mockToken = 'mock-token';

      mockedLogin.mockResolvedValue(mockToken);

      const mockAxiosInstance = {
        post: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await expect(registerForSession(sessionId)).rejects.toThrow('Network error');
    });
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
});
