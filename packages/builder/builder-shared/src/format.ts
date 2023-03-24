import chalk from '@modern-js/utils/chalk';
import { Stats, MultiStats } from './types';

export async function formatStats(
  stats: Stats | MultiStats,
  showWarnings = true,
) {
  const statsData = stats.toJson({
    preset: 'errors-warnings',
  });

  const { formatWebpackMessages } = await import(
    '@modern-js/utils/universal/format-webpack'
  );
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
