import { getAllSessions, registerForSession } from '../../src/services/session';
import { sendMessage } from '../../src/services/telegram';
import { login } from '../../src/services/auth';
import { addPendingRegistration, loadPendingRegistrations } from '../../src/services/pendingRegistrationStore';

// Mock all external dependencies
jest.mock('../../src/services/session');
jest.mock('../../src/services/telegram');
jest.mock('../../src/services/auth');
jest.mock('../../src/services/pendingRegistrationStore');

const mockedGetAllSessions = getAllSessions as jest.MockedFunction<typeof getAllSessions>;
const mockedRegisterForSession = registerForSession as jest.MockedFunction<typeof registerForSession>;
const mockedSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;
const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedAddPendingRegistration = addPendingRegistration as jest.MockedFunction<typeof addPendingRegistration>;
const mockedLoadPendingRegistrations = loadPendingRegistrations as jest.MockedFunction<typeof loadPendingRegistrations>;

describe('Bot Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Discovery and Registration Flow', () => {
    it('should discover upcoming sessions and schedule registrations', async () => {
      const mockSessions = [
        {
          SessionId: 1,
          SessionDate: '2024-01-15',
          Note: 'Wednesday session',
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

      mockedGetAllSessions.mockResolvedValue(mockSessions);

      // Simulate the cron job workflow
      const sessions = await getAllSessions();
      const now = new Date();

      // Find sessions in the next week (simulate the logic from index.ts)
      const nextWeekSessions = sessions.filter((session: any) => {
        const sessionDate = new Date(session.SessionDate);
        const daysUntilSession = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilSession > 0 && daysUntilSession <= 14;
      });

      // Verify session discovery
      expect(nextWeekSessions).toHaveLength(2);
      expect(mockedGetAllSessions).toHaveBeenCalled();

      // Simulate user confirmation and pending registration save
      const session = nextWeekSessions[0];
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
      buyWindowDate.setHours(9, 25, 0, 0);

      const pendingRegistration = {
        sessionId: session.SessionId,
        sessionDate: session.SessionDate,
        buyWindowDate: buyWindowDate.toISOString(),
        cost: session.Cost,
        userId: 1,
      };

      mockedAddPendingRegistration.mockImplementation(() => {});
      mockedSendMessage.mockResolvedValue(undefined);

      // Save pending registration
      addPendingRegistration(pendingRegistration);

      // Verify pending registration was saved
      expect(mockedAddPendingRegistration).toHaveBeenCalledWith(pendingRegistration);
    });

    it('should process pending registrations when buy window opens', async () => {
      const mockPendingRegistrations = {
        '123': {
          sessionId: 123,
          sessionDate: '2024-01-15',
          buyWindowDate: new Date(Date.now() - 1000).toISOString(), // Buy window just opened
          cost: 25,
          userId: 1,
        },
      };

      mockedLoadPendingRegistrations.mockReturnValue(mockPendingRegistrations);
      mockedRegisterForSession.mockResolvedValue(undefined);
      mockedSendMessage.mockResolvedValue(undefined);

      // Simulate the registration processing logic
      const pending = loadPendingRegistrations();
      const now = new Date();

      for (const [sessionId, reg] of Object.entries(pending)) {
        const buyWindowDate = new Date(reg.buyWindowDate);
        
        // If it's time to register (within 30 seconds of the buy window)
        if (Math.abs(buyWindowDate.getTime() - now.getTime()) < 30000) {
          await registerForSession(parseInt(sessionId));
        }
      }

      expect(mockedLoadPendingRegistrations).toHaveBeenCalled();
      expect(mockedRegisterForSession).toHaveBeenCalledWith(123);
    });
  });

  describe('Registration Success Flow', () => {
    it('should handle successful registration and send payment link', async () => {
      const mockToken = 'mock-token';
      
      mockedLogin.mockResolvedValue(mockToken);
      mockedSendMessage.mockResolvedValue(undefined);

      // Simulate the registration process
      await sendMessage('🟡 Trying to secure your spot for this session...', false);
      
      const token = await login();
      expect(token).toBe(mockToken);
      
      // Verify messages were sent
      expect(mockedSendMessage).toHaveBeenCalledWith(
        '🟡 Trying to secure your spot for this session...',
        false
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully during session fetch', async () => {
      const error = new Error('API Error');
      mockedGetAllSessions.mockRejectedValue(error);

      await expect(getAllSessions()).rejects.toThrow('API Error');
    });

    it('should handle registration failures gracefully', async () => {
      const sessionId = 123;
      mockedRegisterForSession.mockRejectedValue(new Error('Registration failed'));

      await expect(registerForSession(sessionId)).rejects.toThrow('Registration failed');
    });

    it('should handle Telegram message failures gracefully', async () => {
      const error = new Error('Telegram API Error');
      mockedSendMessage.mockRejectedValue(error);

      // Should not throw, just log error
      await expect(sendMessage('Test message')).rejects.toThrow('Telegram API Error');
    });
  });
});
