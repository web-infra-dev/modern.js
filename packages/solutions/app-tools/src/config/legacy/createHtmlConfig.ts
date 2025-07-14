import type {
  AppLegacyNormalizedConfig,
  AppNormalizedConfig,
} from '../../types';

export function createHtmlConfig(
  config: Readonly<AppLegacyNormalizedConfig>,
): AppNormalizedConfig<'webpack'>['html'] {
  const {
    disableHtmlFolder,
    favicon,
    inject,
    meta,
    mountId,
    title,
    templateParameters,
    crossorigin,
  } = config.output;

  return {
    disableHtmlFolder,
    favicon,
    inject,
    meta,
    mountId,
    title,
    crossorigin,
    templateParameters,
  };
}
