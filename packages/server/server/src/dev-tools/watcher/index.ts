import path from 'path';
import { fs, chokidar, FSWatcher, WatchOptions } from '@modern-js/utils';
import { DependencyTree } from './dependency-tree';
import { StatsCache } from './stats-cache';

export type WatchEvent = 'add' | 'change' | 'unlink';

export const defaultWatchOptions = {
  // 初始化的时候不触发 add、addDir 事件
  ignoreInitial: true,
  ignored: /api\/typings\/.*/,
};

export const getWatchedFiles = (watcher: FSWatcher) => {
  const watched = watcher.getWatched();
  const files: string[] = [];
  Object.keys(watched).forEach(dir => {
    watched[dir].forEach((fileName: string) => {
      files.push(path.join(dir, fileName));
    });
  });
  return files;
};

export const mergeWatchOptions = (options?: WatchOptions) => {
  const watchOptions = {
    ...options,
  };
  if (watchOptions) {
    const { ignored } = watchOptions;
    const finalIgnored = ignored
      ? [
          defaultWatchOptions.ignored,
          ...(Array.isArray(ignored) ? ignored : [ignored]),
        ]
      : ignored;

    if (finalIgnored) {
      watchOptions.ignored = finalIgnored;
    }
  }

  const finalWatchOptions = {
    ...defaultWatchOptions,
    ...watchOptions,
  };

  return finalWatchOptions;
};

export default class Watcher {
  private dependencyTree: DependencyTree | null = null;

  private watcher!: FSWatcher;

  public listen(
    files: string[],
    options: WatchOptions,
    callback: (changed: string, event: WatchEvent) => void,
  ) {
    const watched = files.filter(Boolean);
    const filenames = watched.map(filename => filename.replace(/\\/g, '/'));

    const cache = new StatsCache();
    const watcher = chokidar.watch(filenames, options);

    watcher.on('ready', () => {
      cache.add(getWatchedFiles(watcher));
    });

    watcher.on('change', changed => {
      if (!fs.existsSync(changed) || cache.isDiff(changed)) {
        cache.refresh(changed);
        callback(changed, 'change');
      }
    });

    watcher.on('add', changed => {
      if (!cache.has(changed)) {
        cache.add([changed]);
        callback(changed, 'add');
      }
    });

    watcher.on('unlink', changed => {
      cache.del(changed);
      callback(changed, 'unlink');
    });

    this.watcher = watcher;
  }

  public createDepTree() {
    this.dependencyTree = new DependencyTree();
  }

  public updateDepTree() {
    this.dependencyTree?.update(require.cache);
  }

  public cleanDepCache(filepath: string) {
    const node = this.dependencyTree?.getNode(filepath);
    if (node && require.cache[filepath]) {
      delete require.cache[filepath];
      for (const parentNode of node.parent.values()) {
        this.cleanDepCache(parentNode.module.filename);
      }
    }
  }

  public close() {
    return this.watcher.close();
  }
}
