export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}', 
    '**/?(*.)+(spec|test).{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/index.css',
    '!src/App.css'
  ],
  
  // Coverage Thresholds - Quality Gates
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Stricter thresholds for critical components
    './src/services/': {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/controllers/': {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/middleware/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage Reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'cobertura'
  ],
  coverageDirectory: 'coverage',
  
  // Test Configuration
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // Performance and Reliability
  maxWorkers: '50%',
  bail: 1,
  verbose: true,
  
  // Test Categories
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Error Handling
  errorOnDeprecated: true,
  
  // Reporters
  reporters: [
    'default'
    // Temporarily disabled jest-junit until dependency is installed
    // [
    //   'jest-junit',
    //   {
    //     outputDirectory: 'test-results',
    //     outputName: 'junit.xml',
    //     ancestorSeparator: ' › ',
    //     uniqueOutputName: 'false',
    //     suiteNameTemplate: '{filepath}',
    //     classNameTemplate: '{classname}',
    //     titleTemplate: '{title}'
    //   }
    // ]
  ]
}; 