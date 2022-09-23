import _ from '@modern-js/utils/lodash';
import { BuilderConfig, NormalizedConfig } from '../../types';
import {
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  mergeBuilderConfig,
} from '../../shared';

const createNormalizer = (normalizer: NormalizedConfig) => {
  return (config: BuilderConfig): NormalizedConfig => {
    return mergeBuilderConfig<NormalizedConfig>(
      _.cloneDeep(normalizer),
      config as NormalizedConfig,
    );
  };
};

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = createNormalizer({
  dev: {
    port: 3000,
    assetPrefix: '/',
    https: false,
    startUrl: true,
    hmr: false,
  },
  html: {},
  tools: {
    tsChecker: {},
    babel: {},
    devServer: {
      client: {},
      devMiddleware: {
        writeToDisk: true,
      },
      hot: true,
      liveReload: true,
      watch: true,
      https: false,
    },
    inspector: false,
  },
  source: {
    preEntry: [],
    globalVars: {},
    alias: {},
    compileJsDataURI: false,
  },
  output: {
    distPath: {
      root: ROOT_DIST_DIR,
      html: HTML_DIST_DIR,
      js: JS_DIST_DIR,
      css: CSS_DIST_DIR,
      svg: SVG_DIST_DIR,
      font: FONT_DIST_DIR,
      image: IMAGE_DIST_DIR,
      media: MEDIA_DIST_DIR,
    },
    filename: {},
    polyfill: 'entry',
    cleanDistPath: true,
    svgDefaultExport: 'url',
  },
  security: { sri: false },
  performance: {
    removeConsole: false,
    removeMomentLocale: false,
    chunkSplit: { strategy: 'split-by-experience' },
  },
  experiments: {},
});
