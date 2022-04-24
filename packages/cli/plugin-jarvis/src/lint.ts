import spawn from 'cross-spawn';
import { chalk, logger, minimist } from '@modern-js/utils';

const ensureOption = (
  args: minimist.ParsedArgs,
  name: string,
  val: string[] | boolean | string,
) => {
  if (!args.hasOwnProperty(name) || args[name].length < 1) {
    if (Array.isArray(val)) {
      return [`--${name}`, val.join(',')];
    }
    if (typeof val === 'boolean') {
      return val ? [`--${name}`] : [`--no-${name}`];
    } else {
      return [`--${name}`, val];
    }
  }
  return [];
};

export default () => {
  const rawArgs = process.argv.slice(3);
  const args = minimist(rawArgs);
  const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.mjsx', '.cjs', '.cjsx'];

  rawArgs.push(...ensureOption(args, 'ext', exts));
  rawArgs.push(...ensureOption(args, 'fix', true));
  rawArgs.push(...ensureOption(args, 'format', 'codeframe'));

  // default ignore pattern
  ['node_modules/', 'dist/', 'output/', 'output_resource/'].forEach(pattern => {
    rawArgs.push(...ensureOption(args, 'ignore-pattern', pattern));
  });

  if (args?._?.length) {
    rawArgs.push(...args._);
  } else {
    rawArgs.push('./');
  }

  const eslintScript = require.resolve('eslint/bin/eslint.js');

  logger.info(chalk.bold('Lint...'));
  logger.info(
    chalk.bold(
      `NODE_OPTIONS="--max-old-space-size=8192" ${eslintScript} ${rawArgs.join(
        ' ',
      )}`,
    ),
  );

  const childprocess = spawn(eslintScript, rawArgs, {
    stdio: 'inherit',
  });

  // eslint-disable-next-line no-process-exit
  childprocess.on('exit', code => process.exit(code || 0));
};
