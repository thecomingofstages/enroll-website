/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch:       ['**/tests/**/*.test.js'],
  testTimeout:     30000,
  // uuid v14 is pure ESM — redirect require('uuid') to CJS shim in tests
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/helpers/uuid-cjs-shim.js',
  },
};
