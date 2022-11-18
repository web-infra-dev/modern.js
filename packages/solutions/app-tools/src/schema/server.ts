export const server = {
  routes: { type: 'object' },
  publicRoutes: { type: 'object' },
  ssr: {
    type: ['boolean', 'object'],
  },
  ssrByEntries: { type: 'object' },
  baseUrl: {
    anyOf: [
      {
        type: 'string',
      },
      {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    ],
  },
  port: {
    type: 'number',
  },
  logger: { type: ['boolean', 'object'] },
  metrics: { type: ['boolean', 'object'] },
};
