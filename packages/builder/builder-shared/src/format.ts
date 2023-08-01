import chalk from '@modern-js/utils/chalk';
import type { Stats, MultiStats } from './types';
import { formatWebpackMessages } from '@modern-js/utils/universal/format-webpack';

export function formatStats(stats: Stats | MultiStats, showWarnings = true) {
  const statsData = stats.toJson({
    preset: 'errors-warnings',
  });

  const { errors, warnings } = formatWebpackMessages(statsData, chalk);

  if (errors.length) {
    const errorMsgs = `${errors.join('\n\n')}\n`;
    const isTerserError = errorMsgs.includes('from Terser');
    const title = chalk.red.bold(
      isTerserError ? `Minify error: ` : `Compile error: `,
    );
    const tip = chalk.yellow(
      isTerserError
        ? `Failed to minify with terser, check for syntax errors.`
        : 'Failed to compile, check the errors for troubleshooting.',
    );

    return {
      message: `${title}\n${tip}\n${errorMsgs}`,
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
