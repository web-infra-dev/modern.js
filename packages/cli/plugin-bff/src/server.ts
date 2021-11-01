import path from 'path';
import { createPlugin } from '@modern-js/server-plugin';
import { injectAPIHandlerInfos } from '@modern-js/bff-utils';
import { API_DIR } from './constants';

export default createPlugin(
  () => ({
    prepareApiServer(props, next) {
      const { pwd, prefix } = props;
      const apiDir = path.resolve(pwd, API_DIR);

      injectAPIHandlerInfos(apiDir, prefix);

      return next(props);
    },
  }),
  { name: '@modern-js/plugin-bff' },
) as any;
