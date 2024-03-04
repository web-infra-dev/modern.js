import { ServerRoute } from '@modern-js/types';
import { getHtmlTemplates } from '../../../utils/templates';
import { ServerNodeMiddleware } from '../hono';

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
