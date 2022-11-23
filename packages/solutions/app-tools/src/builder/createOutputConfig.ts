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
    disableTsChecker,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    dataUriLimit,
    disableAssetsCache,
    enableLatestDecorators,
    disableCssModuleExtension,
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
      svg: mediaPath || 'media',
      image: mediaPath || 'media',
      font: mediaPath || 'media',
      media: mediaPath || 'media',
    },
    dataUriLimit: {
      svg: dataUriLimit,
      image: dataUriLimit,
      font: dataUriLimit,
      media: dataUriLimit,
    },
    disableCssModuleExtension,
    disableInlineRuntimeChunk,
    disableMinimize,
    disableSourceMap,
    disableTsChecker,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
    cleanDistPath: false,
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
