import chokidar, { FSWatcher } from 'chokidar';
import { DependencyTree } from './dependency-tree';
import { StatsCache } from './stats-cache';

const getWatchedFiles = (watcher: chokidar.FSWatcher) => {
  const watched = watcher.getWatched();
  const files: string[] = [];
  Object.keys(watched).forEach(dir => {
    watched[dir].forEach((fileName: string) => {
      files.push(`${dir}/${fileName}`);
    });
  });
  return files;
};

export default class Watcher {
  private dependencyTree: DependencyTree | null = null;

  private watcher!: FSWatcher;

  public listen(files: string[], callback: (changed: string) => void) {
    const watched = files.filter(Boolean);

    const cache = new StatsCache();
    const watcher = chokidar.watch(watched, {
      // 初始化的时候不触发 add、addDir 事件
      ignoreInitial: true,
    });

    watcher.on('ready', () => {
      cache.add(getWatchedFiles(watcher));
    });

    watcher.on('change', changed => {
      if (cache.isDiff(changed)) {
        cache.refresh(changed);
        callback(changed);
      }
    });

    watcher.on('add', changed => {
      if (!cache.has(changed)) {
        cache.add([changed]);
        callback(changed);
      }
    });

    watcher.on('unlink', changed => {
      cache.del(changed);
      callback(changed);
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
