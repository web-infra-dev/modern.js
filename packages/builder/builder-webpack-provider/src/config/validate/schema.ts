import {
  ConfigSchema,
  sharedDevConfigSchema,
  sharedHtmlConfigSchema,
  sharedOutputConfigSchema,
  sharedSourceConfigSchema,
  sharedSecurityConfigSchema,
  sharedExperimentsConfigSchema,
  sharedPerformanceConfigSchema,
} from '@modern-js/builder-shared';
import type {
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  OutputConfig,
  SourceConfig,
  BuilderConfig,
  SecurityConfig,
  ExperimentsConfig,
  PerformanceConfig,
} from '../../types';

const sourceConfigSchema: ConfigSchema<SourceConfig> = {
  type: 'object',
  properties: {
    ...sharedSourceConfigSchema.properties,
    moduleScopes: {
      instanceof: ['Array', 'Function'],
    },
  },
};

const devConfigSchema: ConfigSchema<DevConfig> = sharedDevConfigSchema;
const htmlConfigSchema: ConfigSchema<HtmlConfig> = sharedHtmlConfigSchema;
const securityConfigSchema: ConfigSchema<SecurityConfig> =
  sharedSecurityConfigSchema;
const experimentsConfigSchema: ConfigSchema<ExperimentsConfig> =
  sharedExperimentsConfigSchema;

const outputConfigSchema: ConfigSchema<OutputConfig> = {
  type: 'object',
  properties: {
    ...sharedOutputConfigSchema.properties,
    copy: {
      type: ['array', 'object'],
    },
    convertToRem: {
      type: ['boolean', 'object'],
    },
    externals: {
      instanceof: ['String', 'Function', 'Object', 'RegExp'],
    },
  },
};

const performanceConfigSchema: ConfigSchema<PerformanceConfig> = {
  type: 'object',
  properties: {
    ...sharedPerformanceConfigSchema.properties,
    bundleAnalyze: {
      type: 'object',
    },
    chunkSplit: {
      type: 'object',
    },
  },
};

const toolsConfigSchema: ConfigSchema<ToolsConfig> = {
  type: 'object',
  properties: {
    pug: {
      typeof: ['boolean', 'object', 'function'],
    },
    sass: {
      typeof: ['object', 'function'],
    },
    less: {
      typeof: ['object', 'function'],
    },
    babel: {
      typeof: ['object', 'function'],
    },
    terser: {
      typeof: ['object', 'function'],
    },
    tsLoader: {
      typeof: ['object', 'function'],
    },
    tsChecker: {
      typeof: ['object', 'function'],
    },
    devServer: {
      typeof: 'object',
    },
    minifyCss: {
      typeof: ['object', 'function'],
    },
    htmlPlugin: {
      typeof: ['boolean', 'object', 'function'],
    },
    styledComponents: {
      typeof: ['object', 'function'],
    },
    cssLoader: {
      typeof: ['object', 'function'],
    },
    styleLoader: {
      typeof: ['object', 'function'],
    },
    cssExtract: {
      typeof: 'object',
    },
    postcss: {
      typeof: ['object', 'function'],
    },
    autoprefixer: {
      typeof: ['object', 'function'],
    },
    webpack: {
      typeof: ['object', 'function'],
    },
    webpackChain: {
      typeof: 'function',
    },
    inspector: {
      typeof: ['object', 'function'],
    },
  },
};

export const configSchema: ConfigSchema<BuilderConfig> = {
  type: 'object',
  properties: {
    source: sourceConfigSchema,
    dev: devConfigSchema,
    html: htmlConfigSchema,
    experiments: experimentsConfigSchema,
    output: outputConfigSchema,
    performance: performanceConfigSchema,
    security: securityConfigSchema,
    tools: toolsConfigSchema,
  },
};
