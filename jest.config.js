module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ],
  moduleNameMapper: {
    '^@constants/(.*)$': '<rootDir>/src/shared/constants/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 