import path from 'path';
import { fs, findExists, MAIN_ENTRY_NAME } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig, PluginAPI } from '@modern-js/core';
import type { Entrypoint, HtmlPartials, HtmlTemplates } from '@modern-js/types';
import { HTML_PARTIALS_EXTENSIONS, HTML_PARTIALS_FOLDER } from './constants';
import * as templates from './templates';

enum PartialPosition {
  TOP = 'top',
  HEAD = 'head',
  BODY = 'body',
  BOTTOM = 'bottom',
  INDEX = 'index',
}

const findPartials = (
  dir: string,
  entryName: string,
  position: PartialPosition,
) => {
  if (fs.existsSync(dir)) {
    const base = findExists(
      HTML_PARTIALS_EXTENSIONS.map(ext =>
        path.resolve(dir, `${position}${ext}`),
      ),
    );

    const file = entryName
      ? findExists(
          HTML_PARTIALS_EXTENSIONS.map(ext =>
            path.resolve(dir, entryName, `${position}${ext}`),
          ),
        ) || base
      : base;

    return file ? { file, content: fs.readFileSync(file, 'utf8') } : null;
  }
  return null;
};

// generate html template for
export const getHtmlTemplate = async (
  entrypoints: Entrypoint[],
  api: PluginAPI,
  {
    appContext,
    config,
  }: {
    appContext: IAppContext;
    config: NormalizedConfig;
  },
) => {
  const { appDirectory, internalDirectory } = appContext;
  const {
    source: { configDir },
  } = config;

  const htmlDir = path.resolve(appDirectory, configDir!, HTML_PARTIALS_FOLDER);

  const htmlTemplates: HtmlTemplates = {};

  for (const entrypoint of entrypoints) {
    const { entryName } = entrypoint;
    const name =
      entrypoints.length === 1 && entryName === MAIN_ENTRY_NAME
        ? ''
        : entryName;

    const customIndexTemplate = findPartials(
      htmlDir,
      name,
      PartialPosition.INDEX,
    );

    if (customIndexTemplate) {
      htmlTemplates[entryName] = customIndexTemplate.file;
    } else {
      const hookRunners = api.useHookRunners();
      const { partials } = await hookRunners.htmlPartials({
        entrypoint,
        partials: [
          PartialPosition.TOP,
          PartialPosition.HEAD,
          PartialPosition.BODY,
        ].reduce<HtmlPartials>(
          (previous, position) => {
            const found = findPartials(htmlDir, name, position);
            previous[position as keyof HtmlPartials] = found
              ? [found.content]
              : [];
            return previous;
          },
          {
            top: [],
            head: [],
            body: [],
          },
        ),
      });

      const templatePath = path.resolve(
        internalDirectory,
        entryName,
        'index.html',
      );

      fs.outputFileSync(templatePath, templates.html(partials), 'utf8');

      htmlTemplates[entryName] = templatePath;

      const bottomTemplate = findPartials(
        htmlDir,
        name,
        PartialPosition.BOTTOM,
      );
      if (bottomTemplate) {
        htmlTemplates[`__${entryName}-bottom__`] = bottomTemplate.content;
      }
    }
  }

  return htmlTemplates;
};
