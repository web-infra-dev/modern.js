/**
 * Copy from snowpack
 */
import type { Plugin } from 'rollup';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const isNodeBuiltin = require('is-builtin-module');

export const rollupPluginCatchUnresolvedPluginName =
  'esmpack:rollup-plugin-catch-unresolved';

/**
 * rollup-plugin-catch-unresolved
 *
 * Catch any unresolved imports to give proper warnings (Rollup default is to ignore).
 */
export function rollupPluginCatchUnresolved(): Plugin {
  return {
    name: rollupPluginCatchUnresolvedPluginName,
    resolveId(id, importer) {
      if (isNodeBuiltin(id)) {
        this.warn({
          id: importer,
          message: `"${id}" (Node.js built-in) could not be resolved.`,
        });
      } else {
        if (!id.startsWith('\0')) {
          this.warn({
            id: importer,
            message: `"${id}" could not be resolved. (Is it installed?)`,
          });
        }
      }
      return false;
    },
  };
}
