const enhanceResolve = require('enhanced-resolve');

const resolver = enhanceResolve.create.sync({
  conditionNames: ['jsnext:source', 'require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

module.exports = function (request, options) {
  return resolver(options.basedir, request);
};
