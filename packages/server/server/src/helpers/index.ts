import path from 'path';
import {
  SERVER_BUNDLE_DIRECTORY,
  SERVER_DIR,
  type WatchOptions,
} from '@modern-js/utils';
import Watcher, {
  type WatchEvent,
  mergeWatchOptions,
} from '../dev-tools/watcher';
import { resolveMockDirectory } from './mock';

export * from './repack';
export * from './devOptions';
export * from './fileReader';
export * from './mock';

export function startWatcher({
  pwd,
  distDir,
  apiDir,
  sharedDir,
  mockDir,
  watchOptions,
  onChange,
}: {
  pwd: string;
  distDir: string;
  apiDir: string;
  sharedDir: string;
  mockDir?: string;
  watchOptions?: WatchOptions;
  /**
   * Called after the require cache for a changed user server file has been
   * busted, so the next runtime build re-imports fresh code. Server loader
   * bundles are handled inline (cache drop only) and never reach this.
   */
  onChange: (filepath: string, event: WatchEvent) => void;
}) {
  const defaultWatched = [
    path.join(resolveMockDirectory(pwd, mockDir), '**/*'),
    `${SERVER_DIR}/**/*`,
    `${apiDir}/**`,
    `${sharedDir}/**/*`,
    `${distDir}/${SERVER_BUNDLE_DIRECTORY}/*-server-loaders.js`,
  ];

  const mergedWatchOptions = mergeWatchOptions(watchOptions);

  const defaultWatchedPaths = defaultWatched.map(p => {
    const finalPath = path.isAbsolute(p) ? p : path.join(pwd, p);
    return path.normalize(finalPath);
  });

  const watcher = new Watcher();
  watcher.createDepTree();
  watcher.listen(defaultWatchedPaths, mergedWatchOptions, (filepath, event) => {
    // Server loader bundles are re-read per request via the file reader; just
    // drop the stale require cache, no runtime reload needed.
    if (filepath.includes('-server-loaders.js')) {
      delete require.cache[filepath];
      return;
    }

    // Bust the require cache for the changed module and its parents (incl.
    // modern.server.ts when it or one of its deps changes) so the next runtime
    // build re-imports fresh code, then trigger a unified runtime reload.
    watcher.updateDepTree();
    watcher.cleanDepCache(filepath);
    onChange(filepath, event);
  });

  return watcher;
}
