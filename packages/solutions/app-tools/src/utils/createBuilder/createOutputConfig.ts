import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { NormalizedConfig } from '@modern-js/core';

export function createOutputConfig(
  normalizedConfig: NormalizedConfig,
): BuilderConfig['output'] {
  // TODO: Builder output.cssModuleLocalIdentName
  const {
    assetPrefix,
    copy,
    // cssModuleLocalIdentName,
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
  } = normalizedConfig.output;

  return {
    assetPrefix,
    copy,
    distPath: {
      root: path,
      css: cssPath,
      js: jsPath,
      html: htmlPath,
      svg: mediaPath,
      image: mediaPath,
      font: mediaPath,
      media: mediaPath,
    },
    dataUriLimit: {
      svg: dataUriLimit,
      image: dataUriLimit,
      font: dataUriLimit,
      media: dataUriLimit,
    },
    disableInlineRuntimeChunk,
    disableMinimize,
    disableSourceMap,
    enableCssModuleTSDeclaration,
    enableInlineScripts,
    enableInlineStyles,
    polyfill,
    disableFilenameHash: disableAssetsCache,
  };
}
