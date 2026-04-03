export default {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup/env.setup.js"],
  globalSetup: "<rootDir>/tests/setup/globalSetup.js",
};