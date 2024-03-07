import { execa } from '@modern-js/utils';

export const updateMonorepoDeps = async () => {
  await execa(
    'pnpm',
    ['update', '@modern-js/*', '@modern-js-app/*', '--recursive', '--latest'],
    {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
};
