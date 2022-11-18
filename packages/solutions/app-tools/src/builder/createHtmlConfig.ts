import path from 'path';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { CliNormalizedConfig, IAppContext } from '@modern-js/core';
import { findExists } from '@modern-js/utils';
import { LegacyAppTools } from '../types';

export function createHtmlConfig(
  normalizedConfig: CliNormalizedConfig<LegacyAppTools>,
  appContext: IAppContext,
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

  const { configDir } = normalizedConfig.source;

  // transform Modernjs `output.scriptExt` to Builder `html.crossorigin`  configuration
  const builderCrossorigin = createBuilderCrossorigin(scriptExt);
  const builderAppIcon = createBuilderAppIcon(configDir, appContext);
  const builderFavicon = createBuilderFavicon(favicon, configDir, appContext);

  return {
    appIcon: builderAppIcon,
    disableHtmlFolder,
    favicon: builderFavicon,
    faviconByEntries,
    inject,
    injectByEntries,
    meta,
    metaByEntries,
    mountId,
    title,
    titleByEntries,
    crossorigin: builderCrossorigin,
    templateByEntries: appContext.htmlTemplates,
    templateParameters,
    templateParametersByEntries: templateParametersByEntries as any,
  };
}

const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];

export function createBuilderAppIcon(
  configDir: CliNormalizedConfig<LegacyAppTools>['source']['configDir'],
  appContext: IAppContext,
) {
  const appIcon = findExists(
    ICON_EXTENSIONS.map(ext =>
      path.resolve(appContext.appDirectory, configDir!, `icon.${ext}`),
    ),
  );
  return typeof appIcon === 'string' ? appIcon : undefined;
}

export function createBuilderCrossorigin(
  scriptExt: CliNormalizedConfig<LegacyAppTools>['output']['scriptExt'],
) {
  const scriptExtCustomConfig = scriptExt?.custom as
    | {
        test?: RegExp;
        attribute?: string;
        value?: 'anonymous' | 'use-credentials';
      }
    | undefined;
  return scriptExtCustomConfig?.test?.test('.js') &&
    scriptExtCustomConfig?.attribute === 'crossorigin'
    ? scriptExtCustomConfig.value
    : undefined;
}

export function createBuilderFavicon(
  favicon: CliNormalizedConfig<LegacyAppTools>['output']['favicon'],
  configDir: CliNormalizedConfig<LegacyAppTools>['source']['configDir'],
  appContext: IAppContext,
) {
  const defaultFavicon = findExists(
    ICON_EXTENSIONS.map(ext =>
      path.resolve(appContext.appDirectory, configDir!, `favicon.${ext}`),
    ),
  );
  return favicon || defaultFavicon || undefined;
}
