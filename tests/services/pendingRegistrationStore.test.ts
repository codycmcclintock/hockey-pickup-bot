import fs from 'fs';
import {
  addPendingRegistration,
  loadPendingRegistrations,
  removePendingRegistration,
  PendingRegistration,
} from '../../src/services/pendingRegistrationStore';

// Mock fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Pending Registration Store', () => {
  const mockFilePath = '/Users/codymcclintock/Sites/HockeyPickupAutomation/pending_registrations.json';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addPendingRegistration', () => {
    it('should save pending registration successfully', () => {
      const registration: PendingRegistration = {
        sessionId: 123,
        sessionDate: '2024-01-15',
        buyWindowDate: '2024-01-13T09:25:00Z',
        cost: 25,
        userId: 1,
      };

      const existingData = {};
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingData));

      addPendingRegistration(registration);

      const expectedData = {
        '123': registration,
      };

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(expectedData, null, 2),
        'utf-8'
      );
    });

    it('should merge with existing registrations', () => {
      const existingRegistration: PendingRegistration = {
        sessionId: 456,
        sessionDate: '2024-01-17',
        buyWindowDate: '2024-01-15T09:25:00Z',
        cost: 30,
        userId: 1,
      };

      const newRegistration: PendingRegistration = {
        sessionId: 123,
        sessionDate: '2024-01-15',
        buyWindowDate: '2024-01-13T09:25:00Z',
        cost: 25,
        userId: 1,
      };

      const existingData = { '456': existingRegistration };
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingData));

      addPendingRegistration(newRegistration);

      const expectedData = {
        '456': existingRegistration,
        '123': newRegistration,
      };

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(expectedData, null, 2),
        'utf-8'
      );
    });
  });

  describe('loadPendingRegistrations', () => {
    it('should load pending registrations successfully', () => {
      const registration: PendingRegistration = {
        sessionId: 123,
        sessionDate: '2024-01-15',
        buyWindowDate: '2024-01-13T09:25:00Z',
        cost: 25,
        userId: 1,
      };

      const data = { '123': registration };
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(data));

      const result = loadPendingRegistrations();

      expect(result).toEqual(data);
    });

    it('should return empty object when file does not exist', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = loadPendingRegistrations();

      expect(result).toEqual({});
    });

    it('should return empty object when file is invalid JSON', () => {
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const result = loadPendingRegistrations();

      expect(result).toEqual({});
    });
  });

  describe('removePendingRegistration', () => {
    it('should remove pending registration successfully', () => {
      const registration1: PendingRegistration = {
        sessionId: 123,
        sessionDate: '2024-01-15',
        buyWindowDate: '2024-01-13T09:25:00Z',
        cost: 25,
        userId: 1,
      };

      const registration2: PendingRegistration = {
        sessionId: 456,
        sessionDate: '2024-01-17',
        buyWindowDate: '2024-01-15T09:25:00Z',
        cost: 30,
        userId: 1,
      };

      const existingData = { '123': registration1, '456': registration2 };
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingData));

      removePendingRegistration(123);

      const expectedData = { '456': registration2 };

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(expectedData, null, 2),
        'utf-8'
      );
    });

    it('should handle non-existent registration', () => {
      const existingData = {};
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingData));

      removePendingRegistration(999);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify({}, null, 2),
        'utf-8'
      );
    });
  });
});
