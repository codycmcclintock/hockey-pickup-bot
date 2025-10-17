// Mock axios for testing
export default {
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
  post: jest.fn(),
  get: jest.fn(),
};
