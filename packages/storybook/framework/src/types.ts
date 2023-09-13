import type { StorybookConfig as StorybookConfigBase } from '@storybook/types';
import type { BuilderOptions } from '@modern-js/storybook-builder';

export {
  defineConfig,
  type BuilderOptions,
} from '@modern-js/storybook-builder';

export type FrameworkName = '@modern-js/storybook' | string;

export interface StorybookConfig extends StorybookConfigBase {
  framework:
    | FrameworkName
    | {
        name: FrameworkName;
        options: BuilderOptions;
      };
  typescript?: {
    reactDocgen?: 'react-docgen' | 'react-docgen-typescript' | false;
  } & StorybookConfigBase['typescript'];
}
