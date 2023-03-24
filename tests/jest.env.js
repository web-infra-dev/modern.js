const { TestEnvironment } = require('jest-environment-jsdom');

// https://github.com/facebook/jest/issues/4422
class JestEnvironment extends TestEnvironment {
  constructor(config, testEnvironmentContext) {
    super(
      {
        ...config,
        projectConfig: {
          ...config.projectConfig,
          globals: {
            ...config.projectConfig.globals,
            Uint8Array,
            ArrayBuffer,
          },
        },
      },
      testEnvironmentContext,
    );
  }
}

module.exports = JestEnvironment;
