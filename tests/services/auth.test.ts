// Mock axios before importing auth service
jest.mock('axios');
import { login } from '../../src/services/auth';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the axios instance created in auth service
const mockAxiosInstance = {
  post: jest.fn(),
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        data: {
          Data: {
            Token: 'mock-access-token',
            User: {
              Id: '1',
              Email: 'test@example.com',
              FirstName: 'Test',
              LastName: 'User',
            },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await login();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/Auth/login',
        {
          UserName: 'test@example.com',
          Password: 'test-password',
        }
      );

      expect(result).toBe('mock-access-token');
    });

    it('should throw error when login fails', async () => {
      const mockError = new Error('Login failed');
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      await expect(login()).rejects.toThrow('Login failed');
    });

    it('should throw error when no access token in response', async () => {
      const mockResponse = {
        data: {
          Data: {
            User: {
              Id: '1',
              Email: 'test@example.com',
              FirstName: 'Test',
              LastName: 'User',
            },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      await expect(login()).rejects.toThrow('No token received in login response');
    });
  });
});
