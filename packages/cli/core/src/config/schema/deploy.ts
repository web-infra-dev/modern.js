import { ENTRY_NAME_PATTERN } from '@modern-js/utils';

export const deploy = {
  type: 'object',
  properties: {
    microFrontend: {
      type: 'object',
      dependencies: {
        enableHtmlEntry: { properties: { enableLegacy: { enum: [false] } } },
      },
      properties: {
        enableLegacy: { type: 'boolean' },
        enableHtmlEntry: { type: 'boolean' },
        moduleApp: {
          if: { type: 'array' },
          then: { minItems: 1 },
          else: { type: 'string' },
        },
        platform: { enum: ['garfish', 'goofy'] },
      },
    },
    domain: { type: ['array', 'string'] },
    domainByEntries: {
      type: 'object',
      patternProperties: {
        [ENTRY_NAME_PATTERN]: { type: ['array', 'string'] },
      },
    },
  },
};
