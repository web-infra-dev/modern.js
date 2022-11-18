import { ENTRY_NAME_PATTERN } from '@modern-js/utils/constants';

export const source = {
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
  enableAsyncEntry: { type: 'boolean' },
  disableDefaultEntries: { type: 'boolean' },
  entriesDir: { type: 'string' },
  configDir: { type: 'string' },
};
