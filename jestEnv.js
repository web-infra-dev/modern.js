const JsdomEnvironment = require('jest-environment-jsdom');

// https://github.com/facebook/jest/issues/4422
class JestEnvironment extends JsdomEnvironment {
  constructor(config) {
    super({
      ...config,
      globals: {
        ...config.globals,
        Uint8Array,
        ArrayBuffer,
      },
    });
  }
}

module.exports = JestEnvironment;
