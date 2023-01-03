export const dev = {
  target: 'dev.storybook',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      webpack: { typeof: ['object', 'function'] },
      webpackChain: { typeof: ['function'] },
      // TODO: add runtime api
      // runtime: { type: 'object' },
    },
  },
};

export const schema = [dev];
