import path from 'path';
import { ApiRouter } from '@modern-js/bff-core';
import { API_DIR, isProd, requireExistModule } from '@modern-js/utils';
import type { ServerPlugin } from '@modern-js/server-core';
import { API_APP_NAME } from './constants';

type SF = (args: any) => void;
class Storage {
  public middlewares: SF[] = [];

  reset() {
    this.middlewares = [];
  }
}

const createTransformAPI = (storage: Storage) => ({
  addMiddleware(fn: SF) {
    storage.middlewares.push(fn);
  },
});

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);
    let apiAppPath = '';
    return {
      prepare() {
        const { appDirectory, distDirectory } = api.useAppContext();
        const root = isProd() ? distDirectory : appDirectory;
        const apiPath = path.resolve(root || process.cwd(), API_DIR);
        apiAppPath = path.resolve(apiPath, API_APP_NAME);

        const apiMod = requireExistModule(apiAppPath);
        if (apiMod && typeof apiMod === 'function') {
          apiMod(transformAPI);
        }
      },
      reset() {
        storage.reset();
        const newApiModule = requireExistModule(apiAppPath);
        if (newApiModule && typeof newApiModule === 'function') {
          newApiModule(transformAPI);
        }
      },
      gather({ addAPIMiddleware }) {
        storage.middlewares.forEach(mid => {
          addAPIMiddleware(mid);
        });
      },
      prepareApiServer(props, next) {
        const { pwd, prefix } = props;
        const apiDir = path.resolve(pwd, API_DIR);
        const appContext = api.useAppContext();
        const apiRouter = new ApiRouter({
          apiDir,
          prefix,
        });
        const apiHandlerInfos = apiRouter.getApiHandlers();
        api.setAppContext({
          ...appContext,
          apiRouter,
          apiHandlerInfos,
        });
        return next(props);
      },
    };
  },
});
