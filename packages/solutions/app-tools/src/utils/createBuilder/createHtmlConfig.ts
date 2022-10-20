import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { NormalizedConfig } from '@modern-js/core';

export function createHtmlConfig(
  normalizedConfig: NormalizedConfig,
): BuilderConfig['html'] {
  const {
    disableHtmlFolder,
    favicon,
    faviconByEntries,
    inject,
    injectByEntries,
    meta,
    metaByEntries,
    mountId,
    title,
    titleByEntries,
    scriptExt,
    templateParameters,
    templateParametersByEntries,
  } = normalizedConfig.output;

  // transform Modernjs `output.scriptExt` to Builder `html.crossorigin`  configuration
  const scriptExtCustomConfig = scriptExt?.custom as
    | {
        test?: RegExp;
        attribute?: string;
        value?: 'anonymous' | 'use-credentials';
      }
    | undefined;
  const crossorigin =
    scriptExtCustomConfig?.test?.test('.js') &&
    scriptExtCustomConfig?.attribute === 'crossorigin'
      ? scriptExtCustomConfig.value
      : undefined;

  return {
    disableHtmlFolder,
    favicon,
    faviconByEntries,
    inject,
    injectByEntries,
    meta,
    metaByEntries,
    mountId,
    title,
    titleByEntries,
    crossorigin,
    templateParameters,
    templateParametersByEntries,
  };
}
