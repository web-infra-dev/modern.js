import path from 'path';
import { ServerRoute } from '@modern-js/types';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { ServerNodeMiddleware } from '../hono';
import { setHtmlTemplates, getHtmlTemplates } from '../../../utils';

async function readHtmlTemplates(pwd: string, routes: ServerRoute[]) {
  const htmls = await Promise.all(
    routes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = (await fileReader.readFile(htmlPath, 'utf-8'))?.toString();
      } catch (e) {
        // ignore error
      }
      return [route.entryName!, html];
    }) || [],
  );
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  const templates: Record<string, string> = Object.fromEntries(htmls);

  return templates;
}

export function injectTemplates(
  pwd: string,
  routes?: ServerRoute[],
): ServerNodeMiddleware {
  return async (c, next) => {
    if (!getHtmlTemplates(c) && routes) {
      const templates = await readHtmlTemplates(pwd, routes);
      setHtmlTemplates(c, templates);
    }

    await next();
  };
}
