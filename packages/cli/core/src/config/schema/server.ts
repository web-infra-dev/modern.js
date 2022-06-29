import { ENTRY_NAME_PATTERN } from '@modern-js/utils';

const SERVER_ROUTE_OBJECT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    headers: { type: 'object' },
  },
  additionalProperties: false,
};

export const server = {
  type: 'object',
  additionalProperties: false,
  properties: {
    port: { type: 'number' },
    ssr: {
      if: { type: 'object' },
      then: {
        properties: {
          disableLoadable: { type: 'boolean' },
          disableHelmet: { type: 'boolean' },
          disableRedirect: { type: 'boolean' },
          enableAsyncData: { type: 'boolean' },
          enableProductWarning: { type: 'boolean' },
          timeout: { type: 'number' },
          asyncDataTimeout: { type: 'number' },
        },
      },
      else: { type: 'boolean' },
    },
    ssrByEntries: {
      type: 'object',
      patternProperties: {
        [ENTRY_NAME_PATTERN]: {
          if: { type: 'object' },
          then: {
            properties: {
              disableLoadable: { type: 'boolean' },
              disableHelmet: { type: 'boolean' },
              disableRedirect: { type: 'boolean' },
              enableProductWarning: { type: 'boolean' },
              enableAsyncData: { type: 'boolean' },
              timeout: { type: 'number' },
              asyncDataTimeout: { type: 'number' },
            },
            additionalProperties: false,
          },
          else: { type: 'boolean' },
        },
      },
    },
    routes: {
      type: 'object',
      patternProperties: {
        [ENTRY_NAME_PATTERN]: {
          if: { type: 'object' },
          then: {
            properties: {
              route: {
                oneOf: [
                  { type: 'string' },
                  {
                    type: 'array',
                    items: { oneOf: [{ type: 'string' }, SERVER_ROUTE_OBJECT] },
                  },
                  SERVER_ROUTE_OBJECT,
                ],
              },
              disableSpa: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          else: {
            oneOf: [
              { type: 'string' },
              {
                type: 'array',
                items: { type: 'string' },
              },
            ],
          },
        },
      },
    },
    publicRoutes: {
      type: 'object',
      patternProperties: { [ENTRY_NAME_PATTERN]: { type: ['string'] } },
    },
    baseUrl: {
      oneOf: [
        { type: 'string' },
        {
          type: 'array',
          items: [{ type: 'string' }],
        },
      ],
    },
    middleware: { instanceof: ['Array', 'Function'] },
    renderHook: { instanceof: 'Function' },
    logger: { type: ['object', 'boolean'] },
    metrics: { type: ['object', 'boolean'] },
    proxy: { type: 'object' },
    enableMicroFrontendDebug: { type: 'boolean' },
    watchOptions: { type: 'object' },
  },
};
