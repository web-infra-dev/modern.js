import { ENTRY_NAME_PATTERN } from '@modern-js/utils';

export const source = {
  type: 'object',
  additionalProperties: false,
  properties: {
    entries: {
      type: 'object',
      patternProperties: {
        [ENTRY_NAME_PATTERN]: {
          if: { type: 'object' },
          then: {
            required: ['entry'],
            properties: {
              entry: { type: ['string', 'array'] },
              disableMount: { type: 'boolean' },
              enableFileSystemRoutes: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          else: { type: ['string', 'array'] },
        },
      },
    },
    alias: { typeof: ['object', 'function'] },
    disableDefaultEntries: { type: 'boolean' },
    envVars: { type: 'array' },
    globalVars: { type: 'object' },
    moduleScopes: { instanceof: ['Array', 'Function'] },
    entriesDir: { type: 'string' },
    configDir: { type: 'string' },
    include: { type: ['array'] },
  },
};
