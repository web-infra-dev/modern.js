import path from 'path';
import { fs, findExists } from '@modern-js/utils';
import type { Entrypoint, HtmlPartials, HtmlTemplates } from '@modern-js/types';
import type {
  AppNormalizedConfig,
  AppTools,
  IAppContext,
  PluginAPI,
} from '../../types';
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
  api: PluginAPI<AppTools<'shared'>>,
  {
    appContext,
    config,
  }: {
    appContext: IAppContext;
    config: AppNormalizedConfig<'shared'>;
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
  // sync partialsByEntrypoint to context
  api.setAppContext({
    ...api.useAppContext(),
    partialsByEntrypoint,
  });
  return htmlTemplates;
};
