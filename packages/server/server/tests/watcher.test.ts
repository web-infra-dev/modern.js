import path from 'path';
import { fs } from '@modern-js/utils';
import Watcher, {
  defaultWatchOptions,
  getWatchedFiles,
  mergeWatchOptions,
} from '../src/dev-tools/watcher';
import { StatsCache } from '../src/dev-tools/watcher/stats-cache';

jest.useRealTimers();

describe('watcher', () => {
  jest.setTimeout(25000);
  const pwd = path.join(__dirname, './fixtures/watch');
  const serverDir = path.normalize(path.join(pwd, './tmp-server'));

  beforeAll(() => {
    if (fs.existsSync(serverDir)) {
      fs.removeSync(serverDir);
    }
    fs.mkdirSync(serverDir);
  });

  afterAll(() => {
    fs.removeSync(serverDir);
  });

  // const writeFiles = (content: string, filepath: string) => {
  //   fs.writeFileSync(path.normalize(filepath), content, 'utf8');
  // };

  // TODO 容易导致 timeout，暂时注释掉
  // test('should emit add', done => {
  //   const watcher = new Watcher();
  //   const callback = jest.fn();

  //   const watchDir = path.join(serverDir, 'add');
  //   fs.mkdirSync(watchDir);

  //   watcher.listen(
  //     [`${watchDir}/**/*`],
  //     {
  //       ignoreInitial: true,
  //       ignored: /api\/typings\/.*/,
  //     },
  //     async () => {
  //       try {
  //         callback();
  //         expect(callback).toHaveBeenCalledTimes(1);
  //         await watcher.close();
  //       } catch (e) {
  //         console.error(e);
  //       }
  //       done();
  //     },
  //   );

  //   setTimeout(() => writeFiles('test', path.join(watchDir, 'index.js')), 100);
  // });

  // TODO 容易导致 timeout，暂时注释掉
  // test('should emit unlink', done => {
  //   const watcher = new Watcher();

  //   const callback = jest.fn();
  //   const watchDir = path.join(serverDir, 'unlink');
  //   fs.mkdirSync(watchDir);

  //   const filepath = path.join(watchDir, 'index.js');
  //   writeFiles('unlink', filepath);

  //   watcher.listen(
  //     [`${watchDir}/**/*`],
  //     {
  //       ignoreInitial: true,
  //       ignored: /api\/typings\/.*/,
  //     },
  //     async () => {
  //       callback();
  //       expect(callback).toHaveBeenCalledTimes(1);
  //       await watcher.close();
  //       done();
  //     },
  //   );

  //   setTimeout(() => {
  //     fs.removeSync(filepath);
  //   }, 100);
  // });

  // TODO 容易导致 timeout，暂时注释掉
  // test('should emit change', done => {
  //   const watcher = new Watcher();

  //   const callback = jest.fn();
  //   const watchDir = path.join(serverDir, 'change');
  //   fs.mkdirSync(watchDir);

  //   const filepath = path.join(watchDir, 'index.js');
  //   writeFiles('start', filepath);

  //   watcher.listen(
  //     [`${watchDir}/**/*`],
  //     {
  //       ignoreInitial: true,
  //       ignored: /api\/typings\/.*/,
  //     },
  //     async () => {
  //       callback();
  //       expect(callback).toHaveBeenCalledTimes(1);
  //       await watcher.close();
  //       done();
  //     },
  //   );

  //   setTimeout(() => writeFiles('end', filepath), 100);
  // });

  test('should not emit change when typings file changed', done => {
    const watcher = new Watcher();
    const apiDir = path.normalize(path.join(pwd, './api'));

    const callback = jest.fn();

    if (fs.pathExistsSync(apiDir)) {
      fs.removeSync(apiDir);
    }

    const clear = () => {
      fs.removeSync(apiDir);
    };

    fs.mkdirSync(path.normalize(path.join(apiDir, 'typings')), {
      recursive: true,
    });

    watcher.listen(
      [`${apiDir}/**/*`],
      {
        ignoreInitial: true,
        ignored: /api\/typings\/.*/,
      },
      callback,
    );

    setTimeout(async () => {
      expect(callback).toHaveBeenCalledTimes(0);
      await watcher.close();
      clear();
      done();
    }, 1000);
  });
});

describe('test watcher', () => {
  let watcher: any;
  const baseDir = path.join(__dirname, 'fixtures');
  const watchDir = path.join(baseDir, 'watch/**');
  const filepath = path.join(baseDir, 'watch', 'index.ts');
  const filepatha = path.join(baseDir, 'watch', 'a.ts');
  const txt = path.join(baseDir, 'watch', 'stats.txt');

  afterEach(() => {
    if (watcher) {
      watcher.close();
    }
    fs.writeFileSync(txt, '1');
  });

  it('should create watcher instance correctly', resolve => {
    watcher = new Watcher();
    expect(watcher.dependencyTree).toBeNull();
    watcher.createDepTree();
    expect(watcher.dependencyTree).not.toBeNull();

    expect(watcher.watcher).toBeUndefined();
    watcher.listen([watchDir], {}, () => {
      // empty
    });

    expect(watcher.watcher).toBeDefined();
    require(filepath);
    expect(watcher.dependencyTree.getNode(filepath)).toBeUndefined();
    watcher.updateDepTree();
    expect(watcher.dependencyTree.getNode(filepath)).toBeDefined();
    watcher.cleanDepCache(filepath);
    expect(watcher.dependencyTree.getNode(filepath)).toBeDefined();

    jest.resetModules();
    watcher.updateDepTree();
    expect(watcher.dependencyTree.getNode(filepath)).toBeUndefined();

    setTimeout(() => {
      const fl = getWatchedFiles(watcher.watcher);
      expect(fl.includes(filepatha)).toBeTruthy();
      expect(fl.includes(filepath)).toBeTruthy();
      expect(fl.includes(txt)).toBeTruthy();
      resolve();
    }, 1000);
  });

  it('should stats cache instance work correctly', () => {
    const statsCache = new StatsCache();

    // should not exist false before add
    expect(statsCache.has(txt)).toBeFalsy();

    // should exist true after add
    statsCache.add([txt]);
    expect(statsCache.has(txt)).toBeTruthy();

    // should diff correctly
    fs.writeFileSync(txt, 'foo');
    expect(statsCache.isDiff(txt)).toBeTruthy();

    // should not diff if not refresh
    fs.writeFileSync(txt, '1');
    expect(statsCache.isDiff(txt)).toBeFalsy();

    // should diff after refresh
    fs.writeFileSync(txt, 'foo');
    statsCache.refresh(txt);
    fs.writeFileSync(txt, '1');
    expect(statsCache.isDiff(txt)).toBeTruthy();

    // should diff when content change
    statsCache.refresh(txt);
    fs.writeFileSync(txt, '2');
    expect(statsCache.isDiff(txt)).toBeTruthy();

    // should not exist after del
    statsCache.del(txt);
    expect(statsCache.has(txt)).toBeFalsy();
  });

  it('mergeWatchOptions should works correctly', async () => {
    const options1 = undefined;
    const finalOptions1 = mergeWatchOptions(options1);
    expect(finalOptions1).toEqual(defaultWatchOptions);

    const options2 = {
      ignored: /api\/mock\/.*/,
    };
    const finalOptions2 = mergeWatchOptions(options2);
    expect(finalOptions2).toHaveProperty('ignoreInitial');
    expect(finalOptions2).toHaveProperty('ignored');
    expect((finalOptions2.ignored as unknown[]).length).toBe(2);
    expect(finalOptions2.ignored).toEqual([
      defaultWatchOptions.ignored,
      /api\/mock\/.*/,
    ]);

    const options3 = {
      ignored: [/api\/mock\/.*/],
    };
    const finalOptions = mergeWatchOptions(options3);
    expect(finalOptions).toHaveProperty('ignoreInitial');
    expect(finalOptions).toHaveProperty('ignored');
    expect((finalOptions.ignored as unknown[]).length).toBe(2);
    expect(finalOptions.ignored).toEqual([
      defaultWatchOptions.ignored,
      /api\/mock\/.*/,
    ]);

    const options4 = {
      useFsEvents: false,
    };
    const finalOptions4 = mergeWatchOptions(options4);
    expect(finalOptions4).toEqual({
      ...defaultWatchOptions,
      useFsEvents: false,
    });
  });
});
