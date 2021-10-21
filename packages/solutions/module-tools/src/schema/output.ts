const PACKAGE_MODE_LIST = [
  'universal-js',
  'universal-js-lite',
  'browser-js',
  'browser-js-lite',
  'node-js',
];

export const outputSchema = [
  {
    target: 'output.packageMode',
    schema: { enum: PACKAGE_MODE_LIST },
  },
  {
    target: 'output.packageFields',
    schema: { typeof: 'object' },
  },
  {
    target: 'output.disableTsChecker',
    schema: { typeof: 'boolean' },
  },
  {
    target: 'output.enableSourceMap',
    schema: { typeof: 'boolean' },
  },
  {
    target: 'output.importStyle',
    schema: {
      enum: ['compiled-code', 'source-code'],
      // TODO: 目前default是无效的
      default: 'source-code',
    },
  },
  {
    target: 'output.assetsPath',
    schema: {
      typeof: 'string',
      default: 'styles',
    },
  },
];
