import type { PartialBuildConfig } from '../types';

export const universalJsPreset: PartialBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    path: './dist/js/treeshaking',
    bundlelessOptions: {
      styleCompileMode: 'with-source-code',
    },
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    path: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    path: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    path: './dist/types',
  },
];

export const universalJsLitePreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    path: './dist/js/treeshaking',
    bundlelessOptions: { styleCompileMode: 'with-source-code' },
    dts: false,
  },
  { format: 'cjs', target: 'es6', path: './dist/js/node', dts: false },
  { format: 'esm', target: 'es5', path: './dist/js/modern', dts: false },
  {
    buildType: 'bundleless',
    dts: { only: true },
    path: './dist/types',
  },
];
export const browserJsPreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    path: './dist/js/treeshaking',
    bundlelessOptions: { styleCompileMode: 'with-source-code' },
    dts: false,
  },
  { format: 'esm', target: 'es6', path: './dist/js/node', dts: false },
  { format: 'esm', target: 'es6', path: './dist/js/modern', dts: false },
  {
    buildType: 'bundleless',
    dts: { only: true },
    path: './dist/types',
  },
];

export const browserJsLitePreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    bundlelessOptions: { styleCompileMode: 'with-source-code' },
    dts: false,
    path: './dist/js/treeshaking',
  },
  {
    format: 'esm',
    target: 'es5',
    path: './dist/js/node',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es5',
    path: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    path: './dist/types',
  },
];

export const nodeJsPreset: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    dts: false,
    bundlelessOptions: { styleCompileMode: 'with-source-code' },
    path: './dist/js/node',
  },
  { format: 'esm', target: 'es6', dts: false, path: './js/modern' },
  {
    buildType: 'bundleless',
    dts: { only: true },
    path: './dist/types',
  },
];

export const legacyPresets = {
  UNIVERSAL_JS: universalJsPreset,
  UNIVERSAL_JS_LITE: universalJsLitePreset,
  BROWSER_JS: browserJsPreset,
  BROWSER_JS_LITE: browserJsLitePreset,
  NODE_JS: nodeJsPreset,
};
