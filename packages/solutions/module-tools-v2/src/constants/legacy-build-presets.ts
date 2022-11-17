import path from 'path';
import type { PartialBuildConfig } from '../types';

const legacyWithSourceCodeToCopyConfig = {
  patterns: [
    {
      from: path.join('src', '**/*.{less,sass,scss}'),
      context: 'src',
    },
  ],
};

export const universalJsPreset: PartialBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    outdir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    outdir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];

export const universalJsLitePreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  { format: 'cjs', target: 'es6', outdir: './dist/js/node', dts: false },
  { format: 'esm', target: 'es5', outdir: './dist/js/modern', dts: false },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];
export const browserJsPreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  { format: 'esm', target: 'es6', outdir: './dist/js/node', dts: false },
  { format: 'esm', target: 'es6', outdir: './dist/js/modern', dts: false },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];

export const browserJsLitePreset: PartialBuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    dts: false,
    outdir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  {
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/node',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];

export const nodeJsPreset: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    dts: false,
    outdir: './dist/js/node',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  { format: 'esm', target: 'es6', dts: false, outdir: './js/modern' },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];

export const legacyPresets = {
  UNIVERSAL_JS: universalJsPreset,
  UNIVERSAL_JS_LITE: universalJsLitePreset,
  BROWSER_JS: browserJsPreset,
  BROWSER_JS_LITE: browserJsLitePreset,
  NODE_JS: nodeJsPreset,
};
