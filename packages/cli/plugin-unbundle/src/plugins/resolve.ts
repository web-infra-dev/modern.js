import path from 'path';
import { createDebugger } from '@modern-js/utils';
import { Plugin as RollupPlugin } from 'rollup';
import resolve from 'enhanced-resolve';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { DEFAULT_EXTENSIONS, BARE_SPECIFIER_REGEX } from '../constants';

const debug = createDebugger('esm:resolve');

const resolveExtensions = resolve.create.sync({
  extensions: DEFAULT_EXTENSIONS,
  symlinks: true,
});

export const resolvePlugin = (
  _config: NormalizedConfig,
  { appDirectory }: IAppContext,
): RollupPlugin => ({
  name: 'esm-resolve-extensions',
  resolveId(id, importer = appDirectory) {
    // relative imports( starts with '.')
    if (id.startsWith('.') || BARE_SPECIFIER_REGEX.test(id)) {
      const resolved = resolveExtensions(importer, id);
      debug(`resolve id: ${id} -> ${resolved.toString()}`);

      if (resolved) {
        return resolved;
      }
    }

    // absolute url path
    if (path.isAbsolute(id)) {
      let resolved: string | false = false;
      try {
        // try resolve absolute fs path
        resolved = resolveExtensions(importer, id);
      } catch (err) {
        // resolve path based on importer
        resolved = resolveExtensions(importer, `.${id}`);
      }

      debug(`resolve id: ${id} -> ${resolved.toString()}`);

      if (resolved) {
        return resolved;
      }
    }
  },
});
