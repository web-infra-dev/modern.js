import { UniBuilderRspackConfig } from '../types';
import {
  getDefaultOutputConfig as getRsbuildDefaultOutputConfig,
  getDefaultPerformanceConfig as getRsbuildDefaultPerformanceConfig,
  getDefaultSourceConfig as getRsbuildDefaultSourceConfig,
  getDefaultHtmlConfig as getRsbuildDefaultHtmlConfig,
  getDefaultSecurityConfig as getRsbuildDefaultSecurityConfig,
  getDefaultDevConfig as getRsbuildDefaultDevConfig,
  getDefaultServerConfig as getRsbuildDefaultServerConfig,
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
