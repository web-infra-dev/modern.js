import path from 'path';
import type { StorybookConfig } from '@modern-js/storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: getAbs('@modern-js/storybook'),
    options: {
      bundler: 'webpack',
    },
  },
  typescript: {
    reactDocgen: 'react-docgen',
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;

function getAbs(packageName: string) {
  return path.dirname(require.resolve(packageName + '/package.json'));
}
