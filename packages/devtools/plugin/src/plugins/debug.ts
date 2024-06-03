import { createLogger } from '@modern-js/utils';
import { Plugin } from '../types';

const logger = createLogger({
  level: (process.env.LOG_LEVEL as any) || 'info',
});

export const pluginDebug: Plugin = {
  async setup(api) {
    await api.setupFramework();
    logger.debug('setup framework api');
    await api.setupBuilder();
    logger.debug('setup builder api');
    api.frameworkHooks.afterEach(e => {
      logger.debug('after framework hook:', e.name);
    });
    api.builderHooks.afterEach(e => {
      logger.debug('after builder hook:', e.name);
    });
  },
};
