import { chokidar, FSWatcher } from '@modern-js/utils';

let _watcher: FSWatcher;

export const fsWatcher = {
  init: (appDirectory: string, internalDirectory: string): FSWatcher => {
    _watcher = chokidar.watch([appDirectory], {
      cwd: appDirectory,
      disableGlobbing: true,
      ignored: [
        `${internalDirectory}/**`,
        /\.(git|vscode|DS_Store)\//,
        '**/dist/**',
        '**/build/**',
        '**/output/**',
        '**/output_resource/**',
        `**/__test__/**`,
        `**/*.test.js`,
        `**/*.spec.js`,
        `**/*.stories.js`,
        '**/*.d.ts',
        '**/*.package.json',
        '**/*.tsconfig.json',
        '**/*.env',
      ],
      ignoreInitial: true,
      ignorePermissionErrors: true,
    });
    return _watcher;
  },
  add(path: string) {
    _watcher.add(path);
  },
};
