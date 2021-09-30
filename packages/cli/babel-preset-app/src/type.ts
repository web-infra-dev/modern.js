import { BabelChain } from '@modern-js/babel-chain';

export type { EnvOptions } from '@modern-js/babel-preset-base';

export type Options = {
  target?: 'client' | 'server' | 'modern';
  modules?: 'amd' | 'umd' | 'systemjs' | 'commonjs' | 'cjs' | 'auto' | false;
  useBuiltIns?: 'usage' | 'entry' | false;
  useModern?: boolean;
  useLegacyDecorators?: boolean;
  useTsLoader?: boolean;
  lodash?: Record<string, any>;
  styledCompontents?: Record<string, any>;
  appDirectory: string;
  chain?: BabelChain;
};
