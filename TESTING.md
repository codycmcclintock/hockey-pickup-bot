# Testing Guide for Hockey Pickup Automation Bot

This document explains how to run and maintain tests for the Hockey Pickup Automation bot.

## Test Structure

The test suite is organized as follows:

```
tests/
├── __mocks__/           # Mock implementations for external dependencies
│   ├── axios.ts        # Mock for HTTP requests
│   └── pg.ts           # Mock for PostgreSQL database
├── services/            # Unit tests for service modules
│   ├── auth.test.ts
│   ├── session.test.ts
│   ├── telegram.test.ts
│   └── pendingRegistrationStore.test.ts
├── integration/         # Integration tests
│   └── botWorkflow.test.ts
├── utils/              # Test utilities and helpers
│   └── testHelpers.ts
└── setup.ts            # Global test setup and configuration
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests for CI/CD
```bash
npm run test:ci
```

## Test Categories

### Unit Tests
- **Auth Service**: Tests login functionality and token management
- **Session Service**: Tests session fetching, registration, and formatting
- **Telegram Service**: Tests bot initialization and message sending
- **Pending Registration Store**: Tests file-based storage operations

### Integration Tests
- **Bot Workflow**: Tests complete user workflows from session discovery to registration

## Mocking Strategy

The test suite uses comprehensive mocking to isolate units under test:

- **External APIs**: All HTTP requests are mocked using Jest's axios mock
- **Telegram Bot**: Telegraf bot instance is mocked to prevent actual API calls
- **File System**: File operations are mocked to avoid test side effects
- **Database**: PostgreSQL operations are mocked (when using database storage)

## Test Environment

Tests run with the following environment configuration:
- `NODE_ENV=test`
- Mock credentials for all external services
- Isolated test data that doesn't affect production

## Writing New Tests

### Unit Test Example
```typescript
import { login } from '../../src/services/auth';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: { accessToken: 'mock-token' }
    };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await login();

    expect(result).toBe('mock-token');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.hockeypickup.com/Auth/login',
      expect.objectContaining({
        email: 'test@example.com',
        password: 'test-password'
      })
    );
  });
});
```

### Integration Test Example
```typescript
import { getAllSessions, registerForSession } from '../../src/services/session';

jest.mock('../../src/services/session');

describe('Bot Workflow Integration', () => {
  it('should complete registration workflow', async () => {
    const mockSessions = [{ SessionId: 1, SessionDate: '2024-01-15' }];
    mockedGetAllSessions.mockResolvedValue(mockSessions);

    const sessions = await getAllSessions();
    expect(sessions).toEqual(mockSessions);
  });
});
```

## Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## Continuous Integration

Tests are configured to run in CI/CD environments with:
- Jest in CI mode (`--ci` flag)
- Coverage reporting
- No watch mode for automated runs

## Troubleshooting

### Common Issues

1. **Tests failing due to environment variables**: Ensure `.env` file is not loaded in tests
2. **Mock not working**: Check that mocks are properly imported and configured
3. **Async test timeouts**: Increase timeout in Jest config or use proper async/await patterns

### Debug Mode
Run tests with debug output:
```bash
DEBUG=* npm test
```

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on others
2. **Mock external dependencies**: Never make real API calls in tests
3. **Use descriptive test names**: Test names should clearly describe what they're testing
4. **Test both success and failure cases**: Ensure error handling is covered
5. **Keep tests simple**: One assertion per test when possible
6. **Clean up**: Use `beforeEach` and `afterEach` to reset state

## Adding New Features

When adding new features:

1. Write tests first (TDD approach)
2. Add unit tests for new service functions
3. Add integration tests for new workflows
4. Update mocks if new external dependencies are added
5. Ensure test coverage remains above thresholds

## Maintenance

- Run tests before every commit
- Update tests when changing API contracts
- Review test coverage regularly
- Keep test dependencies up to date
