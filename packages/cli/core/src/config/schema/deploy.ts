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
        enableHtmlEntry: { type: 'boolean' },
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
