import chalk from '@modern-js/utils/chalk';
import { Stats } from '@rspack/core/dist/stats';

export async function formatRspackStats(stats: Stats, showWarnings = true) {
  const statsData = stats.toJson();

  const { errors, warnings } = statsData;

  if (errors?.length) {
    const title = chalk.red.bold(`Compile Error: \n`);
    return {
      message: `${title}${errors.map(e => e.formatted).join('\n\n')}\n`,
      level: 'error',
    };
  }

  // always show warnings in tty mode
  if (warnings?.length && (showWarnings || process.stdout.isTTY)) {
    const title = chalk.yellow.bold(`Compile Warning: \n`);
    return {
      message: `${title}${warnings.map(e => e.formatted).join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}
