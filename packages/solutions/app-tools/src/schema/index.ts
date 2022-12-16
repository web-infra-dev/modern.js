import { ENTRY_NAME_PATTERN } from '@modern-js/utils/constants';
import { Schema } from './Schema';

const source = {
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
  designSystem: { type: 'object' },
};
const bff = {
  prefix: {
    type: 'string',
  },
  proxy: {
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  },
};
const output = {
  ssg: { typeof: ['boolean', 'object', 'function'] },
  disableNodePolyfill: { type: 'boolean' },
};
const dev = {
  proxy: {
    type: ['boolean', 'object'],
  },
};
const server = {
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
  port: { type: 'number' },
  logger: { type: ['boolean', 'object'] },
  metrics: { type: ['boolean', 'object'] },
  enableMicroFrontendDebug: { type: 'boolean' },
  watchOptions: { type: 'object' },
  compiler: { type: 'string' },
  disableFrameworkExt: { type: 'boolean' },
};
const tools = {
  tailwindcss: { type: 'object' },
  jest: { typeof: ['object', 'function'] },
  esbuild: { typeof: ['object'] },
};
const deploy = {
  microFrontend: { type: ['boolean', 'object'] },
};
const builderPlugins = { type: 'array' };

const schema = new Schema();

schema
  .setSchema('bff', bff)
  .setSchema('dev', dev)
  .setSchema('server', server)
  .setSchema('source', source)
  .setSchema('output', output)
  .setSchema('tools', tools)
  .setSchema('deploy', deploy)
  .set('builderPlugin', builderPlugins);

export { default as legacySchema } from './legacy';
export { schema };
