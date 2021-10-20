import babelJest from 'babel-jest';
import { upath } from '@modern-js/utils';

const babelTransformer = (babelJest.createTransformer as any)?.({
  presets: [
    [
      upath.normalizeSafe(require.resolve('@modern-js/babel-preset-app')),
      {
        appDirectory: process.cwd(),
        modules: 'cjs',
      },
    ],
  ],
  configFile: false,
  babelrc: false,
});

export default babelTransformer;
