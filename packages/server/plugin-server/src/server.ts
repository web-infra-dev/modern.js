import path from 'path';
import { createPlugin } from '@modern-js/server-plugin';
import { useAppContext } from '@modern-js/core';
import { isProd, requireExistModule, SERVER_DIR } from '@modern-js/utils';

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

export default createPlugin(
  () => {
    const { appDirectory, distDirectory } = useAppContext();
    const pwd = isProd() ? distDirectory : appDirectory;

    const serverPath = path.resolve(pwd, SERVER_DIR);
    const webAppPath = path.resolve(serverPath, WEB_APP_NAME);

    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);

    const webMod = requireExistModule(webAppPath);
    if (webMod) {
      webMod(transformAPI);
    }

    return {
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
        return storage.hooks.beforeMatch?.({ ...context }, next);
      },
      afterMatch({ context, routeAPI }, next) {
        return storage.hooks.afterMatch?.({ ...context, routeAPI }, next);
      },
      beforeRender({ context }, next) {
        return storage.hooks.beforeRender?.({ ...context }, next);
      },
      afterRender({ context, templateAPI }, next) {
        return storage.hooks.afterRender?.({ ...context, templateAPI }, next);
      },
    };
  },
  {
    name: '@modern-js/plugin-server',
  },
) as any;
