import type {
  IStyledComponentOptions,
  BabelChain,
  BabelConfig,
  BabelConfigUtils,
} from '@modern-js/babel-preset-base';

export type {
  PresetEnvOptions,
  IStyledComponentOptions,
} from '@modern-js/babel-preset-base';

export type Options = {
  target?: 'client' | 'server' | 'modern';
  modules?: 'amd' | 'umd' | 'systemjs' | 'commonjs' | 'cjs' | 'auto' | false;
  useBuiltIns?: 'usage' | 'entry' | false;
  useModern?: boolean;
  useLegacyDecorators?: boolean;
  useTsLoader?: boolean;
  lodash?: Record<string, any>;
  styledComponents?: IStyledComponentOptions;
  appDirectory: string;
  chain?: BabelChain;
  metaName?: string;
  userBabelConfig?: BabelConfig | BabelConfig[];
  userBabelConfigUtils?: Partial<BabelConfigUtils>;
  overrideBrowserslist?: string[];
};
