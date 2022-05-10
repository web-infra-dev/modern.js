import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';
import { isProd, requireExistModule, SERVER_DIR } from '@modern-js/utils';
import { ModernServerContext } from '@modern-js/types';

const WEB_APP_NAME = 'index';

type SF = (args: any, next: any) => void;
class Storage {
  public middlewares: SF[] = [];

  public hooks: Record<string, SF> = {};

  reset() {
    this.middlewares = [];
    this.hooks = {};
  }
}

const createTransformAPI = (storage: Storage) =>
  new Proxy(
    {},
    {
      get(target: any, name: string) {
        if (name === 'addMiddleware') {
          return (fn: SF) => storage.middlewares.push(fn);
        }
        return (fn: SF) => (storage.hooks[name] = fn);
      },
    },
  );

type AfterMatchContext = ModernServerContext & { router: any };
type AfterRenderContext = ModernServerContext & { template: any };

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-server',

  setup: api => {
    const { appDirectory, distDirectory } = api.useAppContext();
    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);
    let webAppPath = '';

    return {
      prepare() {
        const pwd = isProd() ? distDirectory : appDirectory;

        const serverPath = path.resolve(pwd, SERVER_DIR);
        webAppPath = path.resolve(serverPath, WEB_APP_NAME);

        const webMod = requireExistModule(webAppPath);
        if (webMod) {
          webMod(transformAPI);
        }
      },
      reset() {
        storage.reset();
        const newWebModule = requireExistModule(webAppPath);
        if (newWebModule) {
          newWebModule(transformAPI);
        }
      },
      gather({ addWebMiddleware }) {
        storage.middlewares.forEach(mid => {
          addWebMiddleware(mid);
        });
      },
      beforeMatch({ context }, next) {
        if (!storage.hooks.beforeMatch) {
          return next();
        }
        return storage.hooks.beforeMatch(context, next);
      },
      afterMatch({ context, routeAPI }, next) {
        if (!storage.hooks.afterMatch) {
          return next();
        }
        (context as AfterMatchContext).router = routeAPI;
        return storage.hooks.afterMatch(context, next);
      },
      beforeRender({ context }, next) {
        if (!storage.hooks.beforeRender) {
          return next();
        }
        return storage.hooks.beforeRender(context, next);
      },
      afterRender({ context, templateAPI }, next) {
        if (!storage.hooks.afterRender) {
          return next();
        }
        (context as AfterRenderContext).template = templateAPI;
        return storage.hooks.afterRender(context, next);
      },
    };
  },
});
