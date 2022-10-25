import { InternalPlugins } from '@modern-js/types';
import { INTERNAL_CLI_PLUGINS } from './constants';
import { isDepExists } from './is';

export function getInternalPlugins(
  appDirectory: string,
  internalPlugins: InternalPlugins = INTERNAL_CLI_PLUGINS,
) {
  return [
    ...Object.keys(internalPlugins)
      .filter(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string' && config.forced === true) {
          return true;
        }
        return isDepExists(appDirectory, name);
      })
      .map(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string') {
          return config.path;
        } else {
          return config;
        }
      }),
  ];
}
