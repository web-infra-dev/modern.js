import path from 'path';
import type { Options } from '@storybook/types';

export const frameworkOptions = async (_: never, options: Options) => {
  const config = await options.presets.apply('framework');

  if (typeof config === 'string') {
    return {
      name: config,
      options: {},
    };
  }
  if (typeof config === 'undefined') {
    return {
      name: '@modern-js/storybook',
      options: {},
    };
  }

  return {
    name: config.name,
    options: {
      ...config.options,
    },
  };
};

export const modern = async (_options: Options) => {
  return {
    source: {
      alias: {
        '@storybook/react': absPath('@storybook/react'),
      },
    },
  };
};

export const core = async (config: any, options: any) => {
  const framework = await options.presets.apply('framework');

  return {
    ...config,
    builder: {
      name: absPath('@modern-js/storybook-builder'),
      options:
        typeof framework === 'string' ? {} : framework?.options?.builder || {},
    },
    // FIXME: renderer: absPath('@storybook/react'),
    renderer: '@storybook/react',
  };
};

function absPath(pkg: string) {
  return path.dirname(require.resolve(path.join(pkg, 'package.json')));
}
