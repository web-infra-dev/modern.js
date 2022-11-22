import type { webpack } from '../types';
import chalk from '@modern-js/utils/chalk';

export async function formatWebpackStats(
  stats: webpack.Stats | webpack.MultiStats,
  showWarnings = true,
) {
  const statsData = stats.toJson({
    preset: 'errors-warnings',
  });

  const { formatWebpackMessages } = await import('@modern-js/utils');
  const { errors, warnings } = formatWebpackMessages(statsData);

  if (errors.length) {
    const title = chalk.red.bold(`Compile Error: \n`);
    return {
      message: `${title}${errors.join('\n\n')}\n`,
      level: 'error',
    };
  }

  // always show warnings in tty mode
  if (warnings.length && (showWarnings || process.stdout.isTTY)) {
    const title = chalk.yellow.bold(`Compile Warning: \n`);
    return {
      message: `${title}${`${warnings.join('\n\n')}\n`}`,
      level: 'warning',
    };
  }

  return {};
}
