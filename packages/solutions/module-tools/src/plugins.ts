import type { CliPlugin } from '@modern-js/core';
import changesetPlugin from '@modern-js/plugin-changeset';
import lintPlugin from '@modern-js/plugin-lint';

export const getPlugins = (runningCmd: string) => {
  let plugins: CliPlugin[] = [];

  switch (runningCmd) {
    case 'build':
      plugins = [];
      break;
    case 'lint':
      plugins = [lintPlugin()];
      break;
    case 'change':
    case 'release':
    case 'bump':
      plugins = [changesetPlugin()];
      break;
    default:
      plugins = [];
  }

  return plugins;
};
