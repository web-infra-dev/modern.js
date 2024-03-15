import type { BaseBuildConfig } from '../types';

export const getDefaultBuildConfig = () => {
  return Object.freeze<BaseBuildConfig>({
    alias: {},
    asset: {
      limit: 14336,
      path: 'assets',
      publicPath: '',
      svgr: false,
      name: '[name].[hash].[ext]',
    },
    autoExternal: true,
    banner: {},
    buildType: 'bundle',
    copy: {},
    define: {},
    disableSwcTransform: false,
    dts: Object.freeze({
      only: false,
      distPath: './',
      tsconfigPath: undefined,
      abortOnError: true,
      respectExternal: true,
      enableTscBuild: false,
    }),
    autoExtension: false,
    esbuildOptions: c => c,
    externalHelpers: false,
    externals: [],
    format: 'cjs',
    footer: {},
    hooks: [],
    input: ['src/index.ts'],
    jsx: 'automatic',
    metafile: false,
    minify: false,
    outDir: './dist',
    platform: 'node',
    redirect: {
      alias: true,
      asset: true,
      style: true,
      autoExtension: true,
    },
    resolve: {
      mainFields: ['module', 'main'],
      jsExtensions: ['.jsx', '.tsx', '.js', '.ts', '.json'],
    },
    shims: false,
    sideEffects: undefined,
    sourceDir: './src',
    sourceMap: false,
    sourceType: 'module',
    splitting: false,
    style: {
      autoModules: true,
      inject: false,
      less: {},
      modules: {},
      postcss: {},
      sass: {},
      tailwindcss: {},
    },
    target: 'es6',
    transformCache: true,
    transformImport: [],
    transformLodash: false,
    tsconfig: 'tsconfig.json',
    umdGlobals: {},
    umdModuleName: name => name,
  });
};

/**
 * supports require js plugin in less file
 */
export const cssExtensions = ['.less', '.css', '.sass', '.scss', '.js'];
