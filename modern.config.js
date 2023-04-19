const path = require('path');

const monorepoToolPath = path.resolve(
  __dirname,
  'packages/solutions/monorepo-tools/dist/cjs/index.js',
);
const monorepoTools = require(monorepoToolPath).default;

module.exports = {
  plugins: [monorepoTools()],
};
