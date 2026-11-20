import type { StorybookConfig } from 'storybook-react-rsbuild';

export default {
  framework: 'storybook-react-rsbuild',
  addons: ['@storybook/addon-docs', '@modern-js/storybook-addon'],
  stories: ['../src/**/*.stories.@(ts|js)'],
  typescript: { reactDocgen: 'react-docgen-typescript' },
} satisfies StorybookConfig;
