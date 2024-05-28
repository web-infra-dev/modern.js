const skipDts = process.env.SKIP_DTS === 'true';
const dtsConfig = skipDts ? false : {};

/** @type {import('@modern-js/module-tools').ModuleConfigParams} */
module.exports = {
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    outDir: './dist',
    externalHelpers: true,
    transformLodash: true,
    dts: dtsConfig,
    esbuildOptions(options) {
      options.supported ||= {};
      options.supported['dynamic-import'] = true;
      return options;
    },
  },
};
