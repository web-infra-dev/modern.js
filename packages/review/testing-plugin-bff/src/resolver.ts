import enhanceResolve from 'enhanced-resolve';

const resolver = enhanceResolve.create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

const shouldResolveByEnhance = (url: string) => /^@[^/]+\/[^/]+\/.*/.test(url);

// eslint-disable-next-line import/no-commonjs
module.exports = function (request: string, options: any) {
  if (shouldResolveByEnhance(request)) {
    return resolver(options.basedir, request);
  }
  return options.defaultResolver(request, options);
};
