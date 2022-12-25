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
  OutputConfig,
  SourceConfig,
  BuilderConfig,
  SecurityConfig,
  ExperimentsConfig,
  PerformanceConfig,
} from '../../types';

const sourceConfigSchema: ConfigSchema<Omit<SourceConfig, 'moduleScopes'>> = {
  type: 'object',
  properties: {
    alias: {
      typeof: ['object', 'function'],
    },
    define: {
      type: 'object',
    },
    ...sharedSourceConfigSchema.properties,
  },
};
const devConfigSchema: ConfigSchema<DevConfig> = sharedDevConfigSchema;
const htmlConfigSchema: ConfigSchema<HtmlConfig> = sharedHtmlConfigSchema;
const securityConfigSchema: ConfigSchema<SecurityConfig> =
  sharedSecurityConfigSchema;
const experimentsConfigSchema: ConfigSchema<ExperimentsConfig> =
  sharedExperimentsConfigSchema;

const outputConfigSchema: ConfigSchema<Omit<OutputConfig, 'externals'>> = {
  type: 'object',
  properties: {
    ...sharedOutputConfigSchema.properties,
    copy: {
      type: ['array', 'object'],
    },
    convertToRem: {
      type: ['boolean', 'object'],
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

const toolsConfigSchema: ConfigSchema<Record<string, unknown>> = {
  type: 'object',
  properties: {},
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
