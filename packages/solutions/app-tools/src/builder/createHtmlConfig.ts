import path from 'path';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { findExists } from '@modern-js/utils';

export function createHtmlConfig(
  normalizedConfig: NormalizedConfig,
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
  configDir: NormalizedConfig['source']['configDir'],
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
  scriptExt: NormalizedConfig['output']['scriptExt'],
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
  favicon: NormalizedConfig['output']['favicon'],
  configDir: NormalizedConfig['source']['configDir'],
  appContext: IAppContext,
) {
  const defaultFavicon = findExists(
    ICON_EXTENSIONS.map(ext =>
      path.resolve(appContext.appDirectory, configDir!, `favicon.${ext}`),
    ),
  );
  return favicon || defaultFavicon || undefined;
}
