import { chalk } from '@modern-js/utils';
import type { BaseBuildConfig } from '../types';

export const buildingText = chalk.blue('Building...');
export const buildSuccessText = chalk.green('Build succeed');
export const buildFailText = chalk.red('Build Failed:');

export const defaultBuildConfig = Object.freeze<BaseBuildConfig>({
  buildType: 'bundle',
  format: 'cjs',
  target: 'esnext',
  sourceMap: false,
  copy: {},
  outdir: './dist',
  dts: Object.freeze({
    only: false,
    distPath: './',
    tsconfigPath: './tsconfig.json',
  }),
  jsx: 'automatic',
  input: ['src/index.ts'],
  platform: 'node',
  splitting: false,
  externals: [],
  minify: false,
  autoExternal: true,
  entryNames: '[name]',
  umdGlobals: {},
  sourceDir: './src',
  alias: {},
  umdModuleName: name => name,
  define: {},
  asset: {
    path: 'assets',
    limit: 14336,
    publicPath: '',
    svgr: true,
  },
});
