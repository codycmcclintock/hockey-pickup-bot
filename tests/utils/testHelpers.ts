import { PendingRegistration } from '../../src/services/pendingRegistrationStore';

export const createMockSession = (overrides: any = {}) => ({
  SessionId: 123,
  SessionDate: '2024-01-15',
  Note: 'Regular session',
  BuyDayMinimum: 2,
  Cost: 25,
  ...overrides,
});

export const createMockPendingRegistration = (overrides: Partial<PendingRegistration> = {}): PendingRegistration => ({
  sessionId: 123,
  sessionDate: '2024-01-15',
  buyWindowDate: '2024-01-13T09:25:00Z',
  cost: 25,
  userId: 1,
  ...overrides,
});

export const createMockAuthResponse = (overrides: any = {}) => ({
  data: {
    accessToken: 'mock-access-token',
    user: {
      id: 1,
      email: 'test@example.com',
    },
    ...overrides,
  },
});

export const createMockRegistrationResponse = (overrides: any = {}) => ({
  data: {
    Success: true,
    Message: 'Registration successful',
    ...overrides,
  },
  status: 200,
});

export const waitForAsync = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};
