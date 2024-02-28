import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { ServerRoute } from '@modern-js/types';
import { ServerNodeMiddleware } from '../hono';

async function getHtmlTemplates(pwd: string, routes: ServerRoute[]) {
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

export function createInjectHtml(
  pwd: string,
  routes?: ServerRoute[],
): ServerNodeMiddleware {
  return async (c, next) => {
    if (!c.get('templates') && routes) {
      const templates = await getHtmlTemplates(pwd, routes);

      c.set('templates', templates);
    }

    return next();
  };
}
