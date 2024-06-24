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
    api.builderHooks.beforeEach(e => {
      logger.debug('after builder hook:', e.name);
    });
    api.frameworkHooks.beforeEach(e => {
      logger.debug('after framework hook:', e.name);
    });
    api.hooks.beforeEach(e => {
      logger.debug('after hook:', e.name);
    });
  },
};
