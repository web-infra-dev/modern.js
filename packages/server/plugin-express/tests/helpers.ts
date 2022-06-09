import path from 'path';
import { createPlugin } from '@modern-js/server-core';
import { ApiRouter, API_DIR } from '@modern-js/bff-core';

export const APIPlugin = createPlugin(api => ({
  prepareApiServer(props, next) {
    const { pwd, prefix } = props;
    const apiDir = path.resolve(pwd, API_DIR);
    const apiRouter = new ApiRouter({
      apiDir,
      prefix,
    });

    const apiHandlerInfos = apiRouter.getApiHandlers();
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      apiHandlerInfos,
    });
    return next(props);
  },
}));
