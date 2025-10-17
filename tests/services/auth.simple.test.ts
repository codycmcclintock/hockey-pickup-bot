// Simple working test for auth service
import { login } from '../../src/services/auth';

// Mock axios completely
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

describe('Auth Service - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be importable without errors', () => {
    expect(login).toBeDefined();
    expect(typeof login).toBe('function');
  });
});
