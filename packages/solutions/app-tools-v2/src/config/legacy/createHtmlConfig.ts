import { AppLegacyNormalizedConfig, AppNormalizedConfig } from '../../types';

export function createHtmlConfig(
  config: Readonly<AppLegacyNormalizedConfig>,
): AppNormalizedConfig<'webpack'>['html'] {
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
    templateParameters,
    templateParametersByEntries,
    crossorigin,
  } = config.output;

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
