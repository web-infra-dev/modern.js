import path from 'path';
import type { Entrypoint, HtmlPartials, HtmlTemplates } from '@modern-js/types';
import { fs, findExists } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext, AppToolsHooks } from '../../types/new';
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

export const getModifyHtmlPartials = (
  partials: Record<keyof HtmlPartials, string[]>,
) => {
  const append = (type: keyof HtmlPartials, ...script: string[]) => {
    script.forEach(item => {
      partials[type].push(item);
    });
  };
  const prepend = (type: keyof HtmlPartials, ...script: string[]) => {
    script.forEach(item => {
      partials[type].unshift(item);
    });
  };
  return {
    top: {
      append: (...script: string[]) => append(PartialPosition.TOP, ...script),
      prepend: (...script: string[]) => prepend(PartialPosition.TOP, ...script),
      current: partials.top, // compat old plugin
    },
    head: {
      append: (...script: string[]) => append(PartialPosition.HEAD, ...script),
      prepend: (...script: string[]) =>
        prepend(PartialPosition.HEAD, ...script),
      current: partials.head, // compat old plugin
    },
    body: {
      append: (...script: string[]) => append(PartialPosition.BODY, ...script),
      prepend: (...script: string[]) =>
        prepend(PartialPosition.BODY, ...script),
      current: partials.body, // compat old plugin
    },
  };
};

// generate html template for
export const getHtmlTemplate = async (
  entrypoints: Entrypoint[],
  hooks: AppToolsHooks,
  {
    appContext,
    config,
  }: {
    appContext: AppToolsContext;
    config: AppNormalizedConfig;
  },
) => {
  const { appDirectory, internalDirectory } = appContext;
  const {
    source: { configDir },
  } = config;

  const htmlDir = path.resolve(
    appDirectory,
    configDir || '',
    HTML_PARTIALS_FOLDER,
  );

  const htmlTemplates: HtmlTemplates = {};
  const partialsByEntrypoint: Record<string, HtmlPartials> = {};

  for (const entrypoint of entrypoints) {
    const { entryName, isMainEntry } = entrypoint;
    const name = entrypoints.length === 1 && isMainEntry ? '' : entryName;

    const customIndexTemplate = findPartials(
      htmlDir,
      name,
      PartialPosition.INDEX,
    );
    if (customIndexTemplate) {
      htmlTemplates[entryName] = customIndexTemplate.file;
    } else {
      const getPartialInitValue = (position: PartialPosition) => {
        const partial = findPartials(htmlDir, name, position);
        return partial ? [partial.content] : [];
      };
      const partials: Record<keyof HtmlPartials, string[]> = {
        top: getPartialInitValue(PartialPosition.TOP),
        head: getPartialInitValue(PartialPosition.HEAD),
        body: getPartialInitValue(PartialPosition.BODY),
      };

      await hooks.modifyHtmlPartials.call({
        entrypoint,
        partials: getModifyHtmlPartials(partials),
      });

      const templatePath = path.resolve(
        internalDirectory,
        entryName,
        'index.html',
      );

      fs.outputFileSync(templatePath, templates.html(partials), 'utf8');

      htmlTemplates[entryName] = templatePath;
      partialsByEntrypoint[entryName] = partials;

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
  return {
    partialsByEntrypoint,
    htmlTemplates,
  };
};
