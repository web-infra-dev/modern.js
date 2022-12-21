import {
  ConfigSchema,
  SharedDevConfig,
  SharedHtmlConfig,
  SharedOutputConfig,
  SharedSourceConfig,
  SharedSecurityConfig,
  SharedExperimentsConfig,
  SharedPerformanceConfig,
} from './types';

export const sharedSourceConfigSchema: ConfigSchema<SharedSourceConfig> = {
  type: 'object',
  properties: {
    alias: {
      typeof: ['object', 'function'],
    },
    define: {
      type: 'object',
    },
    include: {
      type: 'array',
    },
    exclude: {
      type: 'array',
    },
    preEntry: {
      type: ['string', 'array'],
    },
    globalVars: {
      type: 'object',
    },
    compileJsDataURI: {
      type: 'boolean',
    },
    resolveMainFields: {
      type: ['array', 'object'],
    },
    resolveExtensionPrefix: {
      type: ['string', 'object'],
    },
  },
};

export const sharedDevConfigSchema: ConfigSchema<SharedDevConfig> = {
  type: 'object',
  properties: {
    hmr: {
      type: 'boolean',
    },
    port: {
      type: 'number',
    },
    https: {
      type: ['boolean', 'object'],
    },
    startUrl: {
      type: ['boolean', 'string', 'array'],
    },
    assetPrefix: {
      type: ['string', 'boolean'],
    },
    progressBar: {
      type: ['boolean', 'object'],
    },
  },
};

export const sharedHtmlConfigSchema: ConfigSchema<SharedHtmlConfig> = {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
    },
    metaByEntries: {
      type: 'object',
    },
    title: {
      type: 'string',
    },
    titleByEntries: {
      type: 'object',
    },
    inject: {
      type: ['boolean', 'string'],
    },
    injectByEntries: {
      type: 'object',
    },
    favicon: {
      type: 'string',
    },
    faviconByEntries: {
      type: 'object',
    },
    appIcon: {
      type: 'string',
    },
    mountId: {
      type: 'string',
    },
    crossorigin: {
      type: ['boolean', 'string'],
    },
    disableHtmlFolder: {
      type: 'boolean',
    },
    template: {
      type: 'string',
    },
    templateByEntries: {
      type: 'object',
    },
    templateParameters: {
      typeof: ['function', 'object'],
    },
    templateParametersByEntries: {
      type: 'object',
    },
  },
};

export const sharedExperimentsConfigSchema: ConfigSchema<SharedExperimentsConfig> =
  {
    type: 'object',
    properties: {
      lazyCompilation: {
        type: ['boolean', 'object'],
      },
    },
  };

export const sharedOutputConfigSchema: ConfigSchema<SharedOutputConfig> = {
  type: 'object',
  properties: {
    distPath: {
      type: 'object',
    },
    filename: {
      type: 'object',
    },
    charset: {
      type: 'string',
    },
    polyfill: {
      type: 'string',
    },
    assetsRetry: {
      type: 'object',
    },
    assetPrefix: {
      type: 'string',
    },
    dataUriLimit: {
      type: ['number', 'object'],
    },
    legalComments: {
      type: 'string',
    },
    cleanDistPath: {
      type: 'boolean',
    },
    cssModuleLocalIdentName: {
      type: 'string',
    },
    disableCssExtract: {
      type: 'boolean',
    },
    disableMinimize: {
      type: 'boolean',
    },
    disableSourceMap: {
      type: ['boolean', 'object'],
    },
    disableTsChecker: {
      type: 'boolean',
    },
    disableFilenameHash: {
      type: 'boolean',
    },
    disableInlineRuntimeChunk: {
      type: 'boolean',
    },
    disableCssModuleExtension: {
      type: 'boolean',
    },
    enableAssetManifest: {
      type: 'boolean',
    },
    enableAssetFallback: {
      type: 'boolean',
    },
    enableLatestDecorators: {
      type: 'boolean',
    },
    enableCssModuleTSDeclaration: {
      type: 'boolean',
    },
    enableInlineScripts: {
      type: 'boolean',
    },
    enableInlineStyles: {
      type: 'boolean',
    },
    overrideBrowserslist: {
      type: ['array', 'object'],
    },
    svgDefaultExport: {
      type: 'string',
    },
  },
};

export const sharedPerformanceConfigSchema: ConfigSchema<SharedPerformanceConfig> =
  {
    type: 'object',
    properties: {
      removeConsole: {
        type: ['boolean', 'string'],
      },
      removeMomentLocale: {
        type: 'boolean',
      },
      buildCache: {
        type: ['boolean', 'object'],
      },
      profile: {
        type: 'boolean',
      },
      printFileSize: {
        type: 'boolean',
      },
    },
  };

export const sharedSecurityConfigSchema: ConfigSchema<SharedSecurityConfig> = {
  type: 'object',
  properties: {
    sri: {
      type: ['object', 'boolean'],
    },
  },
};
