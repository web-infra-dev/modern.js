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
  preEntry: { type: ['string', 'array'] },
  alias: { typeof: ['object', 'function'] },
  enableAsyncEntry: { type: 'boolean' },
  disableDefaultEntries: { type: 'boolean' },
  envVars: { type: 'array' },
  globalVars: { type: 'object' },
  moduleScopes: { instanceof: ['Array', 'Function'] },
  entriesDir: { type: 'string' },
  configDir: { type: 'string' },
  include: { type: ['array'] },
};

const output = {
  assetPrefix: { type: 'string' },
  path: { type: 'string' },
  jsPath: { type: 'string' },
  cssPath: { type: 'string' },
  htmlPath: { type: 'string' },
  mediaPath: { type: 'string' },
  mountId: { type: 'string' },
  favicon: { type: 'string' },
  faviconByEntries: {
    type: 'object',
    patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'string' } },
  },
  title: { type: 'string' },
  titleByEntries: {
    type: 'object',
    patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'string' } },
  },
  meta: { type: 'object' },
  metaByEntries: {
    type: 'object',
    patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'object' } },
  },
  inject: { enum: [true, 'head', 'body', false] },
  injectByEntries: {
    type: 'object',
    patternProperties: {
      [ENTRY_NAME_PATTERN]: { enum: [true, 'head', 'body', false] },
    },
  },
  copy: { type: 'array' },
  scriptExt: { type: 'object' },
  disableTsChecker: { type: 'boolean' },
  disableHtmlFolder: { type: 'boolean' },
  disableCssModuleExtension: { type: 'boolean' },
  disableCssExtract: { type: 'boolean' },
  enableCssModuleTSDeclaration: { type: 'boolean' },
  disableMinimize: { type: 'boolean' },
  enableInlineStyles: { type: 'boolean' },
  enableInlineScripts: { type: 'boolean' },
  disableSourceMap: { type: 'boolean' },
  disableInlineRuntimeChunk: { type: 'boolean' },
  disableAssetsCache: { type: 'boolean' },
  enableLatestDecorators: { type: 'boolean' },
  enableTsLoader: { type: 'boolean' },
  dataUriLimit: { type: 'number' },
  templateParameters: { type: 'object' },
  templateParametersByEntries: {
    type: 'object',
    patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'object' } },
  },
  polyfill: {
    type: 'string',
    enum: ['usage', 'entry', 'off', 'ua'],
  },
  cssModuleLocalIdentName: { type: 'string' },
  federation: { type: 'object' },
  disableNodePolyfill: { type: 'boolean' },
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

const dev = {
  proxy: {
    type: ['boolean', 'object'],
  },
};

const deploy = {
  microFrontend: { type: ['boolean', 'object'] },
};

const tools = {
  tailwindcss: { type: 'object' },
  jest: { typeof: ['object', 'function'] },
  esbuild: { typeof: ['object'] },
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

const schema = new Schema();
schema
  .setSchema('bff', bff)
  .setSchema('dev', dev)
  .setSchema('server', server)
  .setSchema('source', source)
  .setSchema('output', output)
  .setSchema('tools', tools)
  .setSchema('deploy', deploy);

export default schema;
