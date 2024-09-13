import type { CliPlugin } from '@modern-js/core';
import { changesetPlugin } from '@modern-js/plugin-changeset';

export const getPlugins = (runningCmd: string) => {
  let plugins: CliPlugin[] = [];

  switch (runningCmd) {
    case 'build':
      plugins = [];
      break;
    case 'change':
    case 'release':
    case 'bump':
    case 'pre':
    case 'gen-release-note':
      plugins = [changesetPlugin()];
      break;
    default:
      plugins = [];
  }

  return plugins;
};
