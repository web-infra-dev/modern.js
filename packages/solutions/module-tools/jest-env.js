const NodeEnvironment = require('jest-environment-node');

class AegirEnvironment extends NodeEnvironment {
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

module.exports = AegirEnvironment;
