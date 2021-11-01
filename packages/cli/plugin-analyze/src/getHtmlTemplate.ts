import path from 'path';
import { fs, findExists } from '@modern-js/utils';
import { IAppContext, NormalizedConfig, mountHook } from '@modern-js/core';
import type { Entrypoint, HtmlPartials, HtmlTemplates } from '@modern-js/types';
import {
  HTML_PARTIALS_EXTENSIONS,
  HTML_PARTIALS_FOLDER,
  MAIN_ENTRY_NAME,
} from './constants';
import * as templates from './templates';

enum PartialPosition {
  TOP = 'top',
  HEAD = 'head',
  BODY = 'body',
  INDEX = 'index',
}

const findPartials = (
  dir: string,
  entryName: string,
  postion: PartialPosition,
) => {
  if (fs.existsSync(dir)) {
    const base = findExists(
      HTML_PARTIALS_EXTENSIONS.map(ext =>
        path.resolve(dir, `${postion}${ext}`),
      ),
    );

    const file = entryName
      ? findExists(
          HTML_PARTIALS_EXTENSIONS.map(ext =>
            path.resolve(dir, entryName, `${postion}${ext}`),
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
      const { partials } = await (mountHook() as any).htmlPartials({
        entrypoint,
        partials: [
          PartialPosition.TOP,
          PartialPosition.HEAD,
          PartialPosition.BODY,
        ].reduce<HtmlPartials>(
          (previous, position) => {
            const finded = findPartials(htmlDir, name, position);
            previous[position as keyof HtmlPartials] = finded
              ? [finded.content]
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
    }
  }

  return htmlTemplates;
};
