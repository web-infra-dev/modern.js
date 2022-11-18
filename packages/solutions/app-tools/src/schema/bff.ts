export const bff = {
  prefix: {
    type: 'string',
  },
  proxy: {
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  },
  fetcher: {
    type: 'string',
  },
};
