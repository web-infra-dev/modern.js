import { logger } from '@modern-js/utils';

export function checkIsDuplicationPlugin(
  plugins: (string | undefined)[],
  autoLoadPlugin = false,
) {
  const set = new Set();
  const duplicationPlugins: string[] = [];
  plugins
    .filter(plugin => typeof plugin === 'string')
    .forEach(plugin => {
      if (set.has(plugin)) {
        duplicationPlugins.push(plugin as string);
      } else {
        set.add(plugin);
      }
    });

  if (duplicationPlugins.length > 0) {
    logger.warn(
      `Check your duplicate registration for these plugins: ${duplicationPlugins.join(
        ',',
      )}.`,
    );
    if (autoLoadPlugin) {
      logger.warn(
        'This is probably because you enabled `autoLoadPlugin` configuration and also registered these plugins manually',
      );
    }
  }
}
