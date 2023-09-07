import path from 'path';
import type { StorybookConfig } from '@modern-js/storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: getAbs('@modern-js/storybook'),
    options: {
      bundler: 'webpack',
    },
  },
  typescript: {
    // can use both in webpack and rspack
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
