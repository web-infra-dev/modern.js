import type { HonoContext } from '../../core/server';

declare module 'hono' {
  interface ContextVariableMap {
    templates?: Record<string, string>;
  }
}

export function setHtmlTemplates(
  c: HonoContext,
  templates: Record<string, string> = {},
) {
  c.set('templates', templates);
}

export function getHtmlTemplates(c: HonoContext) {
  return c.get('templates');
}
