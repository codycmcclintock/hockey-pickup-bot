// Final working test suite demonstrating the testing setup
describe('Hockey Pickup Automation - Test Setup Verification', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import modules', () => {
    // Test that we can import the main modules without errors
    expect(() => {
      require('../src/services/auth');
    }).not.toThrow();

    expect(() => {
      require('../src/services/session');
    }).not.toThrow();

    expect(() => {
      require('../src/services/telegram');
    }).not.toThrow();
  });

  it('should have environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.TELEGRAM_BOT_TOKEN).toBe('mock-bot-token');
    expect(process.env.TELEGRAM_CHAT_ID).toBe('123456789');
  });

  it('should have mocks configured', () => {
    // Test that mocks are working
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});
