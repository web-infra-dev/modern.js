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
    outDir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    outDir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    outDir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outDir: './dist/types',
  },
];

const universalJsLitePreset = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outDir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    outDir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outDir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outDir: './dist/types',
  },
];
const browserJsPreset = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outDir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    outDir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    outDir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outDir: './dist/types',
  },
];

const browserJsLitePreset = [
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/js/treeshaking',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outDir: './dist/js/node',
    dts: false,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    outDir: './dist/js/modern',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outDir: './dist/types',
  },
];

const nodeJsPreset = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es6',
    dts: false,
    outDir: './dist/js/node',
    copy: legacyWithSourceCodeToCopyConfig,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es6',
    dts: false,
    outDir: './dist/js/modern',
  },
  {
    buildType: 'bundleless',
    dts: { only: true },
    outDir: './dist/types',
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
