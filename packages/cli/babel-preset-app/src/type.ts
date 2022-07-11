import type { BabelConfig, BabelConfigUtils } from '@modern-js/core';
import type {
  IStyledComponentOptions,
  BabelChain,
} from '@modern-js/babel-preset-base';

export type {
  EnvOptions,
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
};
