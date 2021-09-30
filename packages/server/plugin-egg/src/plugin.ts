import * as path from 'path';
import fs from 'fs';
import { Application } from 'egg';
import { createPlugin } from '@modern-js/server-plugin';
import { registerMiddleware, registerRoutes } from './utils';

export { default as egg } from 'egg';

interface FrameConfig {
  middleware: Application['middleware'] | string[];
}

type StartOptions = Partial<{
  baseDir: string;
  mode: string;
  framework: string;
}>;

export type Mode = 'function' | 'framework';

const API_DIR = './api';
const SERVER_DIR = './server';

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

  const agent = new Agent({ ...options });
  await agent.ready();
  const application = new App({ ...options });
  application.agent = agent;
  agent.application = application;
  await application.ready();

  application.messenger.broadcast('egg-ready');

  return application;
};

const enableTs = (pwd: string) => {
  const tsconfig = path.join(pwd, 'tsconfig.json');
  if (fs.existsSync(tsconfig)) {
    process.env.EGG_TYPESCRIPT = 'true';
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

export default createPlugin(
  () => ({
    async prepareApiServer({ pwd, mode, config, prefix }) {
      const apiDir = path.join(pwd, API_DIR);
      enableTs(pwd);
      const app: Application = await initApp({
        framework: './framework',
        baseDir: apiDir,
      });

      const { router } = app;

      // remove routes first
      app.middleware.splice(app.middleware.length - 1, 1);

      if (mode === 'framework') {
        registerRoutes(router, prefix);
      } else if (mode === 'function') {
        if (config) {
          const { middleware } = config as FrameConfig;
          if (Array.isArray(middleware) && middleware.length > 0) {
            registerMiddleware(app, middleware as any);
          }
        }

        initEggConfig(app);
        registerRoutes(router, prefix as string);
      } else {
        throw new Error(`mode must be function or framework`);
      }
      app.use(router.routes());

      return (req, res) => {
        app.on('error', err => {
          if (err) {
            throw err;
          }
        });
        return Promise.resolve(app.callback()(req, res));
      };
    },
    async prepareWebServer({ config, pwd }) {
      const serverDir = path.join(pwd, SERVER_DIR);
      enableTs(pwd);
      const app = await initApp({
        framework: './framework',
        baseDir: serverDir,
      });

      app.use(async (ctx, next) => {
        await next();
        if (!ctx.body) {
          // restore statusCode
          if (ctx.res.statusCode === 404) {
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
  {
    name: '@modern-js/plugin-egg',
    pre: ['@modern-js/plugin-bff'],
  },
);
