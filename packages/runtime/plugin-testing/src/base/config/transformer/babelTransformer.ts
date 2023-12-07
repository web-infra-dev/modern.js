import babelJest from 'babel-jest';
import { isBeyondReact17 } from '@modern-js/utils';

const isNewJsx = isBeyondReact17(process.cwd());

const babelTransformer = (babelJest.createTransformer as any)?.({
  presets: [
    [
      require.resolve('@rsbuild/babel-preset/node'),
      {
        pluginDecorators: {
          version: 'legacy',
        },
      },
    ],
    [
      require.resolve('@babel/preset-react'),
      {
        runtime: isNewJsx ? 'automatic' : 'classic',
      },
    ],
  ],
  configFile: false,
  babelrc: false,
});

export default babelTransformer;
