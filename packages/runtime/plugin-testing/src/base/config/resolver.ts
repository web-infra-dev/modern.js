import enhanceResolve from 'enhanced-resolve';

const resolver = enhanceResolve.create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

const shouldResolveByEnhance = (url: string) => /^@[^/]+\/[^/]+\/.*/.test(url);

const internalResolve = function (request: string, options: any) {
  if (shouldResolveByEnhance(request)) {
    return resolver(options.basedir, request);
  }
  return options.defaultResolver(request, options);
};

module.exports = internalResolve;

export default internalResolve;
