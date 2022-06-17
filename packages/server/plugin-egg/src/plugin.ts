import * as path from 'path';
import fs from 'fs';
import cp from 'child_process';
import { Application } from 'egg';
import { createTsHelperInstance } from 'egg-ts-helper';
import type { ServerPlugin } from '@modern-js/server-core';
import { APIHandlerInfo, API_DIR } from '@modern-js/bff-core';
import { registerMiddleware, registerRoutes } from './utils';

interface FrameConfig {
  middleware: Application['middleware'] | string[];
}

type StartOptions = Partial<{
  baseDir: string;
  mode: string;
  framework: string;
}>;

const SERVER_DIR = './server';

let agent: any;
let application: any;

const mockFn = (
  obj: Record<string, any>,
  name: string,
  fn: (oldImpl: (...args: any[]) => any) => (...args: any[]) => any,
): (() => void) => {
  const oldImpl = obj[name];
  const newImpl = fn(oldImpl);
  obj[name] = newImpl;
  return () => {
    obj[name] = oldImpl;
  };
};

const initApp = async (options: StartOptions): Promise<Application> => {
  options.baseDir = options.baseDir || process.cwd();
  options.mode = 'single';

  if (!options.framework) {
    try {
      options.framework = require(path.join(
        options.baseDir,
        '../',
        'package.json',
      )).egg.framework;
    } catch (_) {}
  }
  let Agent;
  let App;
  if (options.framework) {
    // eslint-disable-next-line prefer-destructuring
    Agent = require(options.framework).Agent;
    App = require(options.framework).Application;
  } else {
    App = require('egg/lib/application');
    Agent = require('egg/lib/agent');
  }

  if (application) {
    agent.close();
    application.close();
  }

  agent = new Agent({ ...options });
  await agent.ready();
  application = new App({ ...options });
  application.agent = agent;
  agent.application = application;
  await application.ready();

  application.messenger.broadcast('egg-ready');

  return application;
};

const enableTs = (pwd: string, generateType: boolean) => {
  const tsconfig = path.join(pwd, 'tsconfig.json');
  const isTsProject = fs.existsSync(tsconfig);
  if (!isTsProject) {
    return;
  }
  process.env.EGG_TYPESCRIPT = 'true';

  if (generateType) {
    const watch = process.env.NODE_ENV === 'development';
    const files = ['tsconfig.json', 'package.json'];
    const apiDir = path.join(pwd, API_DIR);

    const restoreExists = mockFn(fs, 'existsSync', originFn => filename => {
      for (const file of files) {
        if (filename === path.join(apiDir, file)) {
          return originFn.call(fs, path.join(pwd, file));
        }
      }
      return originFn.call(fs, filename);
    });

    const restoreReadFile = mockFn(
      fs,
      'readFileSync',
      originFn =>
        (...args: any[]) => {
          const filename = args[0];
          for (const file of files) {
            if (filename === path.join(apiDir, file)) {
              return originFn.apply(fs, [
                path.join(pwd, file),
                ...args.slice(1),
              ]);
            }
          }
          return originFn.apply(fs, [filename, ...args.slice(1)]);
        },
    );

    const restoreExec = mockFn(cp, 'execSync', originFn => (...args: any[]) => {
      if (args) {
        const opts = args[1];
        const cwd = opts?.cwd;
        if (cwd && cwd === apiDir) {
          opts.cwd = path.join(cwd, '../');
        }
        return originFn.apply(cp, [args[0], args[1], ...args.slice(2)]);
      }
      return originFn.apply(cp, [...args]);
    });

    createTsHelperInstance({ watch, cwd: apiDir }).build();

    restoreExists();

    restoreReadFile();

    restoreExec();
  }
};

const initEggConfig = (app: Application) => {
  const { config: appConfig, name: appName } = app;
  appConfig.keys = `${appName}_1629203606760_3869`;
  appConfig.middleware = [];
  // appConfig.middleware = config.middlewares
  appConfig.security.csrf = {
    ...appConfig.security.csrf,
    enable: false,
  };
};

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-egg',
  pre: ['@modern-js/plugin-bff'],
  setup: api => ({
    async prepareApiServer({ pwd, mode, config, prefix }) {
      const apiDir = path.join(pwd, API_DIR);
      const appContext = api.useAppContext();
      const apiHandlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];

      const isGenerateType = process.env.NODE_ENV === 'development';
      enableTs(pwd, isGenerateType);
      const app: Application = await initApp({
        framework: './framework',
        baseDir: apiDir,
      });

      const { router } = app;
      if (prefix) {
        router.prefix(prefix);
      }

      // remove routes first
      app.middleware.splice(app.middleware.length - 1, 1);

      if (mode === 'framework') {
        registerRoutes(router, apiHandlerInfos);
      } else if (mode === 'function') {
        if (config) {
          const { middleware } = config as FrameConfig;
          if (Array.isArray(middleware) && middleware.length > 0) {
            registerMiddleware(app, middleware as any);
          }
        }

        initEggConfig(app);
        registerRoutes(router, apiHandlerInfos);
      } else {
        throw new Error(`mode must be function or framework`);
      }
      app.use(router.routes());

      return (req, res) => {
        return Promise.resolve(app.callback()(req, res));
      };
    },
    async prepareWebServer({ config, pwd }) {
      const serverDir = path.join(pwd, SERVER_DIR);
      enableTs(pwd, false);
      const app = await initApp({
        framework: './framework',
        baseDir: serverDir,
      });

      app.use(async (ctx, next) => {
        await next();
        if (!ctx.body) {
          // restore statusCode
          if (
            ctx.res.statusCode === 404 &&
            !(ctx.response as any)._explicitStatus
          ) {
            ctx.res.statusCode = 200;
          }
          ctx.respond = false;
        }
      });

      if (config) {
        const { middleware } = config as FrameConfig;
        if (Array.isArray(middleware) && middleware.length > 0) {
          registerMiddleware(app, middleware as any);
        }
      }

      initEggConfig(app);

      return (req, res) => {
        app.on('error', err => {
          if (err) {
            throw err;
          }
        });
        return Promise.resolve(app.callback()(req, res));
      };
    },
  }),
});

export { default as egg } from 'egg';
