import { IncomingMessage, ServerResponse } from 'http';
import { ServerRoute as Route } from './route';
import { NextFunction } from './utils';
import { ModernServerContext } from './context';

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type TemplateAPI = {
  get: () => Promise<string>;
  set: (html: string) => void;
  prependBody: (frag: string) => TemplateAPI;
  prependHead: (frag: string) => TemplateAPI;
  appendBody: (frag: string) => TemplateAPI;
  appendHead: (frag: string) => TemplateAPI;
  replace: (tag: string, frag: string) => TemplateAPI;
};

export type RouteAPI = {
  cur: () => Route;
  get: (entryName: string) => Route | undefined;
  use: (entryName: string) => boolean;
};

type HookHandler<Context> = (ctx: Context, next: NextFunction) => Promise<void>;
type Hook<Context> = (fn: HookHandler<Context>) => void;
export type ModernServerHook = {
  beforeMatch: Hook<ModernServerContext>;
  afterMatch: Hook<ModernServerContext & { router: RouteAPI }>;
  beforeRender: Hook<ModernServerContext>;
  afterRender: Hook<ModernServerContext & { template: TemplateAPI }>;
};
