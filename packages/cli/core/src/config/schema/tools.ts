export const tools = {
  type: 'object',
  additionalProperties: false,
  properties: {
    webpack: { typeof: ['object', 'function'] },
    babel: { typeof: ['object', 'function'] },
    postcss: { typeof: ['object', 'function'] },
    lodash: { typeof: ['object', 'function'] },
    devServer: { type: 'object' },
    tsLoader: { typeof: ['object', 'function'] },
    autoprefixer: { typeof: ['object', 'function'] },
    terser: { typeof: ['object', 'function'] },
    minifyCss: { typeof: ['object', 'function'] },
  },
};
