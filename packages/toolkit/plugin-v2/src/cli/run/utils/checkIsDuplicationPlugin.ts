import { logger } from '@modern-js/utils';

export function checkIsDuplicationPlugin(plugins: (string | undefined)[]) {
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
      `Duplicate registration plugins: ${duplicationPlugins.join(',')}.`,
    );
  }
}
