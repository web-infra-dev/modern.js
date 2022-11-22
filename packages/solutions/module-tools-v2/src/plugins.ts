import type { CliPlugin } from '@modern-js/core';
import ChangesetPlugin from '@modern-js/plugin-changeset';
import LintPlugin from '@modern-js/plugin-lint';

export const getPlugins = (runningCmd: string) => {
  let plugins: CliPlugin[] = [];

  switch (runningCmd) {
    case 'build':
      plugins = [];
      break;
    case 'lint':
      plugins = [LintPlugin()];
      break;
    case 'change':
    case 'release':
    case 'bump':
      plugins = [ChangesetPlugin()];
      break;
    default:
      plugins = [];
  }

  return plugins;
};
