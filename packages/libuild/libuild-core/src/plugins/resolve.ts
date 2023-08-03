import { LibuildPlugin } from '../types';
import { DATAURL_JAVASCRIPT_PATTERNS } from '../constants/regExp';
import { isUrl } from '../bundler/resolve';

export const resolvePlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:resolve';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (isUrl(args.path)) {
          // we only need to handle import| dynamic import and no need to handle require
          const isImport = args.kind === 'dynamic-import' || args.kind === 'import-statement';
          const isJavascript = DATAURL_JAVASCRIPT_PATTERNS.test(args.path);
          return {
            path: args.path,
            external: !(isImport && isJavascript),
          };
        }
        const result = await compiler.resolve(args.path, {
          kind: args.kind,
          importer: args.importer,
          resolveDir: args.resolveDir,
        });

        if ((result.path as any as boolean) === false) {
          return {
            path: '/empty-stub',
            sideEffects: false,
          };
        }
        if (result.path) {
          return result;
        }
      });
      compiler.hooks.load.tapPromise('libuild:resolve', async (args) => {
        if (args.path === '/empty-stub') {
          return {
            contents: 'module.exports = {}',
          };
        }
      });
    },
  };
};
