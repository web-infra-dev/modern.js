const createJiti = require('jiti');
const jiti = createJiti(__filename);

const mod = jiti('../../src/loader.ts', { default: true });

module.exports = mod.default;
module.exports.raw = mod.raw;
