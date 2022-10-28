import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { createCopyPattern } from './share';

export function createOutputConfig(
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): BuilderConfig['output'] {
  // TODO: add `externals` options in Modern.

  const {
    assetPrefix,
    copy,
    cssModuleLocalIdentName,
    cssPath,
    jsPath,
    htmlPath,
    mediaPath,
    path,
    disableInlineRuntimeChunk,
    disableMinimize,
    disableSourceMap,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    dataUriLimit,
    disableAssetsCache,
    enableLatestDecorators,
    disableCssExtract,
  } = normalizedConfig.output;

  const defaultCopyPattern = createCopyPattern(
    appContext,
    normalizedConfig,
    'upload',
  );
  const builderCopy = copy
    ? [...copy, defaultCopyPattern]
    : [defaultCopyPattern];

  return {
    assetPrefix,
    copy: builderCopy,
    distPath: {
      root: path,
      css: cssPath,
      js: jsPath,
      html: htmlPath,
      // `@modern-js/webpack` output all media files to `dist/media` by default
      svg: mediaPath || 'midia',
      image: mediaPath || 'midia',
      font: mediaPath || 'midia',
      media: mediaPath || 'midia',
    },
    dataUriLimit: {
      svg: dataUriLimit,
      image: dataUriLimit,
      font: dataUriLimit,
      media: dataUriLimit,
    },
    disableCssModuleExtension: disableCssExtract,
    disableInlineRuntimeChunk,
    disableMinimize,
    disableSourceMap,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    disableFilenameHash: disableAssetsCache,
    enableLatestDecorators,
    filename: {
      css: cssModuleLocalIdentName,
    },
    // `@modern-js/webpack` used to generate asset manifest by default
    enableAssetManifest: true,
    // compatible the modern-js with fallback behavior
    enableAssetFallback: true,
  };
}
