import { ENTRY_NAME_PATTERN } from '@modern-js/utils';
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
            customBootstrap: { type: 'string' },
          },
          additionalProperties: false,
        },
        else: { type: ['string', 'array'] },
      },
    },
  },
  mainEntryName: { type: 'string' },
  enableAsyncEntry: { type: 'boolean' },
  disableDefaultEntries: { type: 'boolean' },
  entriesDir: { type: 'string' },
  disableEntryDirs: { type: 'array' },
  configDir: { type: 'string' },
  designSystem: { type: 'object' },
};
const bff = {
  prefix: {
    type: 'string',
  },
  httpMethodDecider: {
    type: 'string',
    enum: ['functionName', 'inputParams'],
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
const dev = {};
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
  enableFrameworkExt: { type: 'boolean' },
};
const tools = {
  esbuild: { typeof: ['object'] },
};
const deploy = {};
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
