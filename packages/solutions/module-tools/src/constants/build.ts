import { chalk } from '@modern-js/utils';
import type { BaseBuildConfig } from '../types';

export const buildingText = chalk.blue('Building...');
export const buildSuccessText = chalk.green('Build succeed');
export const buildFailText = chalk.red('Build Failed:');

export const defaultBuildConfig = Object.freeze<BaseBuildConfig>({
  buildType: 'bundle',
  format: 'cjs',
  target: 'es6',
  sourceMap: false,
  copy: {},
  outDir: './dist',
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
  umdGlobals: {},
  sourceDir: './src',
  alias: {},
  metafile: false,
  umdModuleName: name => name,
  define: {},
  asset: {
    path: 'assets',
    limit: 14336,
    publicPath: '',
    svgr: false,
  },
  style: {
    less: {},
    sass: {},
    postcss: {},
    tailwindCss: {},
    inject: false,
    autoModules: true,
    modules: {},
  },
});
