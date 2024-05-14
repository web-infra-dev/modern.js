import path from 'path';
import type {
  HookContext,
  MiddlewareContext,
  NextFunction,
} from '@modern-js/types';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';

const WEB_APP_NAME = 'index';

export type Hook = (ctx: HookContext, next: NextFunction) => void;
export type Middleware = (ctx: MiddlewareContext, next: NextFunction) => void;

export type ServerMod = {
  default: (args: any) => void;
  middleware: Middleware[];
  unstableMiddleware: any[];
  afterMatch: Hook;
  afterRender: Hook;
};

// load server/_middleware file middlewares
export const loadMiddleware = (pwd: string = process.cwd()) => {
  const middlewarePath = path.resolve(pwd, SERVER_DIR, '_middleware');

  const middlewareMode = requireExistModule(middlewarePath, {
    interop: false,
  });

  const { middleware = [] } = middlewareMode || {};
  return {
    middleware,
  };
};

// load server/index file hooks and middlewares
export const loadServerMod = (pwd: string = process.cwd()) => {
  const webAppPath = path.resolve(pwd, SERVER_DIR, WEB_APP_NAME);
  const mod: ServerMod = requireExistModule(webAppPath, {
    interop: false,
  });
  const {
    default: defaultExports,
    middleware,
    unstableMiddleware,
    ...hooks
  } = mod || {};

  return {
    defaultExports,
    unstableMiddleware,
    hooks,
    middleware,
  };
};
