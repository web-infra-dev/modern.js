import type { Plugin } from 'rollup';

/**
 * rollup-plugin-strip-source-mapping
 *
 * Remove any lingering source map comments
 */
export function rollupPluginStripSourceMapping(): Plugin {
  return {
    name: 'rollup-plugin-strip-source-mapping',
    transform: code => {
      const resolvedCode = code.replace(
        /^\/\/#\s*sourceMappingURL=[a-zA-Z0-9-_\*\?\.\/\&=+%\s]+$/gm,
        '',
      );
      return {
        code: resolvedCode,
        map: null,
      };
    },
  };
}
