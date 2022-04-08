import { BabelChain } from '@modern-js/babel-chain';
import { BabelConfig } from '@modern-js/core';
import { IStyledComponentOptions } from '@modern-js/babel-preset-base';

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
  userBabelConfig?: BabelConfig;
};
