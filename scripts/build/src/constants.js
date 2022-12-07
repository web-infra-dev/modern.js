const path = require('path');

const legacyWithSourceCodeToCopyConfig = {
  patterns: [
    {
      from: path.join('src', '**/*.{less,sass,scss}'),
      context: 'src',
    },
  ],
};

const universalJsPreset = [
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

const universalJsLitePreset = [
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
const browserJsPreset = [
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
    format: 'esm',
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

const browserJsLitePreset = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    outdir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outdir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
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

const nodeJsPreset = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    dts: false,
    outdir: './dist/js/node',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    dts: false,
    outdir: './dist/js/modern',
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outdir: './dist/types',
  },
];

const legacyPresets = {
  UNIVERSAL_JS: universalJsPreset,
  UNIVERSAL_JS_LITE: universalJsLitePreset,
  BROWSER_JS: browserJsPreset,
  BROWSER_JS_LITE: browserJsLitePreset,
  NODE_JS: nodeJsPreset,
};

module.exports = {
  legacyPresets,
};
