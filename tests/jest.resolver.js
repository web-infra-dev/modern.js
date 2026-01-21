const enhanceResolve = require('enhanced-resolve');
const path = require('path');

const resolver = enhanceResolve.create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

module.exports = function (request, options) {
  if (request === 'import-meta-resolve') {
    return path.join(__dirname, 'utils/mock-import-meta-resolve.js');
  }
  // to support importing esm files in cjs, remove the .js suffix and it will be handled by the resolver
  if (
    request.endsWith('.js') &&
    (request.startsWith('.') || request.startsWith('..'))
  ) {
    // biome-ignore lint/style/noParameterAssign: <explanation>
    request = request.replace('.js', '');
  }
  return resolver(options.basedir, request);
};
