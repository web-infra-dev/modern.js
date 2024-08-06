const enhanceResolve = require('enhanced-resolve');

const resolver = enhanceResolve.create.sync({
  conditionNames: ['jsnext:source', 'require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

module.exports = function (request, options) {
  // to support importing esm files in cjs, remove the .js suffix and it will be handled by the resolver
  if (
    request.endsWith('.js') &&
    (request.startsWith('.') || request.startsWith('..'))
  ) {
    // eslint-disable-next-line no-param-reassign
    request = request.replace('.js', '');
  }
  return resolver(options.basedir, request);
};
