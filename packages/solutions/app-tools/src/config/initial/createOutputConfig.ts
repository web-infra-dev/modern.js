import { AppLegacyNormalizedConfig, AppNormalizedConfig } from '../../types';

export function createOutputConfig(
  config: Readonly<AppLegacyNormalizedConfig>,
): AppNormalizedConfig['output'] {
  const {
    assetPrefix,
    copy,
    cssModuleLocalIdentName,
    cssPath,
    jsPath,
    htmlPath,
    mediaPath,
    enableTsLoader,
    path,
    disableInlineRuntimeChunk,
    disableCssExtract,
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
    ssg,
    disableNodePolyfill,
  } = config.output;

  return {
    assetPrefix,
    copy,
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
    disableCssExtract,
    disableCssModuleExtension,
    disableInlineRuntimeChunk,
    disableMinimize,
    disableSourceMap,
    disableTsChecker: disableTsChecker || enableTsLoader,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    disableFilenameHash: disableAssetsCache,
    enableLatestDecorators,
    filename: {
      css: cssModuleLocalIdentName,
    },
    ssg,
    // set `true`, only in legacy config
    enableAssetFallback: true,
    enableAssetManifest: true,
    disableNodePolyfill,
  };
}
