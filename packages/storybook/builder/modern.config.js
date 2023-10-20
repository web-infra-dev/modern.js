const { nodeBuildConfig } = require('@scripts/build');

/**
 * disableSwcTransform, so we can preserve exports annotation statements from esbuild.
 *
 * node.js import() expression can load CommonJS, **BUT** if you want to access the
 * member exported from loaded CommonJS, the loaded CommonJS **MUST** point out the
 * exported members explictly, what does this mean?
 *
 * bar.js
 * ```
 * exports.a = 1;
 * ```
 *
 * foo.js
 * ```
 * const res = await import('./bar.js'); // res: { a: 1, default: { a: 1 } }
 * ```
 *
 * But if exports from bar.js cannot be known from compile time:
 * ```bar.js
 * function __export(m, v) { Object.defineProperty(exports, m, { value: v }) };
 * __export('a', 1)
 * ```
 *
 * foo.js
 * ```
 * const res = await import('./bar.js'); // res: { default: { a: 1 } }
 * ```
 *
 * Esbuild will emit something like:
 * ```
 * function __export(m, v) { Object.defineProperty(exports, m, { value: v }) };
 * __export('a', 1)
 * 0 && (module.exports = { a });
 * ```
 *
 * So it can be known at compile time.
 *
 * But now modern.js module-tools SWC will delete that annotation
 */
module.exports = {
  buildConfig: nodeBuildConfig.map(config => {
    return { ...config, disableSwcTransform: true, externalHelpers: false };
  }),
};
