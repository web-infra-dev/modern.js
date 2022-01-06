import path from 'path';
import { createPlugin } from '@modern-js/server-plugin';
import { injectAPIHandlerInfos, API_DIR } from '@modern-js/bff-utils';

export const APIPlugin = createPlugin(() => ({
  prepareApiServer(props, next) {
    const { pwd, prefix } = props;
    const apiDir = path.resolve(pwd, API_DIR);

    injectAPIHandlerInfos(apiDir, prefix);

    return next(props);
  },
}));
