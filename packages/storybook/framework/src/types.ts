import type { StorybookConfig as StorybookConfigBase } from '@storybook/types';
import { FrameworkOptions } from '.';

export {
  defineConfig,
  type FrameworkOptions,
} from '@modern-js/storybook-builder';

export type FrameworkName = '@modern-js/storybook' | string;

export interface StorybookConfig extends StorybookConfigBase {
  framework:
    | FrameworkName
    | {
        name: FrameworkName;
        options: FrameworkOptions;
      };
  typescript?: {
    reactDocgen?: 'react-docgen' | 'react-docgen-typescript' | false;
  } & StorybookConfigBase['typescript'];
}
