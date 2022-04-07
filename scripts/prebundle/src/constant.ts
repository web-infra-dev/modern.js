import { join } from 'path';

export const ROOT_DIR = join(__dirname, '..', '..', '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

export const TASKS = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [{ name: 'chalk' }],
  },
];
