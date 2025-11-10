// tests/setup.ts
import { jest } from "@jest/globals";

// Mock global fetch for testes
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock console.error para testes mais limpos
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  jest.clearAllMocks();
});
