export const dev = {
  assetPrefix: {
    anyOf: [
      {
        type: 'string',
      },
      {
        type: 'boolean',
      },
    ],
  },
  https: {
    type: ['boolean', 'object'],
  },
  proxy: {
    type: ['boolean', 'object'],
  },
};
