import { createBabelChain } from '@modern-js/babel-chain';
import type { IImportCheckOpts } from './import-check';
import type { IImportPathOpts } from './import-path';

export type BuiltInOptsType = IImportCheckOpts & IImportPathOpts;

export const getBuildInPlugins = (opts: BuiltInOptsType) => {
  const chain = createBabelChain();
  chain
    .plugin('@modern-js/babel-plugin-import-check')
    .use(require.resolve('./import-check'), [opts]);
  chain
    .plugin('@modern-js/babel-plugin-import-path')
    .use(require.resolve('./import-path'), [opts]);

  return chain;
};
