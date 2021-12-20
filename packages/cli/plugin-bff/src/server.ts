import path from 'path';
import { createPlugin } from '@modern-js/server-plugin';
import { injectAPIHandlerInfos } from '@modern-js/bff-utils';
import { useAppContext } from '@modern-js/core';
import { API_DIR, isProd, requireExistModule } from '@modern-js/utils';
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

export default createPlugin(
  () => {
    const { appDirectory, distDirectory } = useAppContext();

    const root = isProd() ? distDirectory : appDirectory;

    const apiPath = path.resolve(root || process.cwd(), API_DIR);
    const apiAppPath = path.resolve(apiPath, API_APP_NAME);

    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);

    const apiMod = requireExistModule(apiAppPath);
    if (apiMod && typeof apiMod === 'function') {
      apiMod(transformAPI);
    }

    return {
      reset() {
        storage.reset();
        const newApiModule = requireExistModule(apiAppPath);
        if (newApiModule) {
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

        injectAPIHandlerInfos(apiDir, prefix);

        return next(props);
      },
    };
  },
  { name: '@modern-js/plugin-bff' },
) as any;
