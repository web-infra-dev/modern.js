import _ from 'lodash';

import { UniBuilderRspackConfig } from '../types';
import {
  getDefaultOutputConfig as getRsbuildDefaultOutputConfig,
  getDefaultPerformanceConfig as getRsbuildDefaultPerformanceConfig,
  getDefaultSourceConfig as getRsbuildDefaultSourceConfig,
  getDefaultHtmlConfig as getRsbuildDefaultHtmlConfig,
  getDefaultSecurityConfig as getRsbuildDefaultSecurityConfig,
  getDefaultDevConfig as getRsbuildDefaultDevConfig,
  getDefaultServerConfig as getRsbuildDefaultServerConfig,
  castArray,
  isFunction,
  isUndefined,
  isOverriddenConfigKey as isRsbuildOverriddenConfigKey,
} from '@rsbuild/shared';

const rsbuildDefaultServerConfig = getRsbuildDefaultServerConfig();

export const getDefaultDevConfig = () => ({
  ...getRsbuildDefaultDevConfig(),
  port: rsbuildDefaultServerConfig.port,
  host: rsbuildDefaultServerConfig.host,
  https: false,
  progressBar: true,
});

export const getDefaultSourceConfig = (): UniBuilderRspackConfig['source'] => ({
  ...getRsbuildDefaultSourceConfig(),
  globalVars: {},
});

const rsbuildDefaultHtmlConfig = getRsbuildDefaultHtmlConfig();

export const getDefaultHtmlConfig = (): UniBuilderRspackConfig['html'] => ({
  inject: rsbuildDefaultHtmlConfig.inject,
  mountId: rsbuildDefaultHtmlConfig.mountId,
  crossorigin: rsbuildDefaultHtmlConfig.crossorigin,
  scriptLoading: rsbuildDefaultHtmlConfig.scriptLoading,
  disableHtmlFolder: false,
  title: '',
});

export const getDefaultSecurityConfig = () => ({
  ...getRsbuildDefaultSecurityConfig(),
  checkSyntax: false,
});

export const getDefaultToolsConfig = () => ({
  tsChecker: {},
});

export const getDefaultExperimentsConfig = () => ({
  sourceBuild: false,
});

export const getDefaultPerformanceConfig = getRsbuildDefaultPerformanceConfig;

export const HTML_DIST_DIR = 'html';

const rsbuildDefaultOutputConfig = getRsbuildDefaultOutputConfig();

export const getDefaultOutputConfig = (): UniBuilderRspackConfig['output'] => ({
  ...rsbuildDefaultOutputConfig,
  distPath: {
    ...rsbuildDefaultOutputConfig.distPath,
    html: HTML_DIST_DIR,
  },
  polyfill: 'entry',
  svgDefaultExport: 'url',
  disableSvgr: false,
  disableTsChecker: false,
  disableCssModuleExtension: false,
  disableInlineRuntimeChunk: false,
  enableAssetFallback: false,
  enableAssetManifest: false,
  enableLatestDecorators: false,
  enableInlineScripts: false,
  enableInlineStyles: false,
  cssModules: {
    exportLocalsConvention: 'camelCase',
  },
});

const isOverriddenConfigKey = (key: string) =>
  ['enableInlineScripts', 'enableInlineStyles'].includes(key);

export const mergeUniBuilderConfig = <T>(...configs: T[]): T =>
  _.mergeWith(
    {},
    ...configs,
    (target: unknown, source: unknown, key: string) => {
      const pair = [target, source];
      if (pair.some(isUndefined)) {
        // fallback to lodash default merge behavior
        return undefined;
      }

      // Some keys should use source to override target
      if (isRsbuildOverriddenConfigKey(key) || isOverriddenConfigKey(key)) {
        return source ?? target;
      }

      if (pair.some(Array.isArray)) {
        return [...castArray(target), ...castArray(source)];
      }
      // convert function to chained function
      if (pair.some(isFunction)) {
        return [target, source];
      }
      // fallback to lodash default merge behavior
      return undefined;
    },
  );
