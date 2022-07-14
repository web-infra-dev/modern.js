const { Compilation } = require('webpack');
const { ConcatSource } = require('webpack-sources');
const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

class WrapperPlugin {
  /**
   * @param {object} args
   * @param {string | Function} [args.header]  - Text that will be prepended to an output file.
   * @param {string | Function} [args.footer] - Text that will be appended to an output file.
   * @param {string | RegExp} [args.test] - Tested against output file names to check if they should be affected by this
   * plugin.
   * @param {boolean} [args.afterOptimizations=false] - Indicating whether this plugin should be activated before
   * (`false`) or after (`true`) the optimization stage. Example use case: Set this to true if you want to avoid
   * minification from affecting the text added by this plugin.
   */

  constructor(args) {
    if (typeof args !== 'object') {
      throw new TypeError('Argument "args" must be an object.');
    }

    this.header = args.hasOwnProperty('header') ? args.header : '';
    this.footer = args.hasOwnProperty('footer') ? args.footer : '';
    this.afterOptimizations = args.hasOwnProperty('afterOptimizations')
      ? Boolean(args.afterOptimizations)
      : false;
    this.test = args.hasOwnProperty('test') ? args.test : '';
  }

  apply(compiler) {
    const { header } = this;
    const { footer } = this;
    const tester = { test: this.test };

    compiler.hooks.compilation.tap('WrapperPlugin', compilation => {
      if (this.afterOptimizations) {
        compilation.hooks.processAssets.tap(
          {
            name: 'WrapperPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
          },
          assets => {
            wrapChunks(compilation, assets, footer, header);
          },
        );
      } else {
        compilation.hooks.optimizeChunkAssets.tapAsync(
          'WrapperPlugin',
          (chunks, done) => {
            wrapChunks(compilation, chunks, footer, header);
            done();
          },
        );
      }
    });

    function wrapFile(compilation, fileName) {
      const headerContent =
        typeof header === 'function' ? header(fileName) : header;
      const footerContent =
        typeof footer === 'function' ? footer(fileName) : footer;

      compilation.updateAsset(
        fileName,
        () =>
          new ConcatSource(
            String(headerContent),
            compilation.assets[fileName],
            String(footerContent),
          ),
      );
    }

    function wrapChunks(compilation, assets) {
      for (const fileName of Object.keys(assets)) {
        if (ModuleFilenameHelpers.matchObject(tester, fileName)) {
          wrapFile(compilation, fileName);
        }
      }
    } // wrapChunks
  }
}

module.exports = WrapperPlugin;
