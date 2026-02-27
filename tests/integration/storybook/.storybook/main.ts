import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from 'storybook-react-rsbuild';

const getAbsolutePath = (value: string): any => {
  return path.resolve(
    fileURLToPath(
      new URL(import.meta.resolve(`${value}/package.json`, import.meta.url)),
    ),
    '..',
  );
};

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-docs',
    {
      // For this repo, you can use `storybook-addon-modernjs` directly.
      name: getAbsolutePath('storybook-addon-modernjs'),
      options: {},
    },
  ],
  framework: {
    // For this repo, you can use `storybook-react-rsbuild` directly.
    name: getAbsolutePath('storybook-react-rsbuild'),
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: () => true,
    },
    check: true,
  },
};

export default config;
