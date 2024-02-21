import { execa } from '../compiled';

export const newAction = async (
  config: Record<string, any>,
  solution: 'module' | 'mwa' | 'monorepo',
) => {
  await execa(
    'npx',
    [
      '--yes',
      `@modern-js/new-action@${process.env.MODERN_JS_VERSION ?? 'latest'}`,
      `--config=${JSON.stringify(config)}`,
      `--solution=${solution}`,
    ],
    {
      stderr: 'inherit',
      stdout: 'inherit',
      stdin: 'inherit',
    },
  );
};

export const upgradeAction = async () => {
  await execa(
    'npx',
    [
      '--yes',
      `@modern-js/upgrade@${process.env.MODERN_JS_VERSION ?? 'latest'}`,
      ...process.argv.slice(2),
    ],
    {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
};
