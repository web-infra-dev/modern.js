import * as path from 'path';
import { fs, logger } from '@modern-js/utils';
import {
  buildWatch,
  BuildWatchEmitter,
  runBuildWatch,
  BuildWatchEvent,
} from '../src/buildWatch';
import { ICompilerResult } from '../src/type';

const projectDir = path.join(__dirname, './fixtures/buildWatch');
const srcDir = path.join(projectDir, 'src');
const distDir = path.join(projectDir, 'dist');

const originalLogInfo = logger.info;
const originalLogError = logger.error;

describe('test build watch', () => {
  let testLogs: any[] = [];
  const mockedLogInfo = (s: string | number | Error | undefined) =>
    testLogs.push(s);
  beforeEach(() => {
    logger.info = mockedLogInfo;
    logger.error = mockedLogInfo;
  });

  it('class BuildWatchEmitter', async () => {
    let run = false;
    const emitter = new BuildWatchEmitter();
    emitter.setInitFn(() => {
      run = true;
    });
    await emitter.watch();
    expect(run).toBe(true);

    const emitter_1 = new BuildWatchEmitter();
    emitter_1.setInitFn(true as any);
    const ret = await emitter_1.watch();
    expect(ret).toBe(null);
  });

  it('runBuildWatch and success', async done => {
    let compiling = false;
    const emitter = new BuildWatchEmitter();
    emitter.on(BuildWatchEvent.firstCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(0);
    });
    emitter.on(BuildWatchEvent.compiling, () => {
      expect(compiling).toBe(true);
    });
    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(0);
      watcher.close();
      done();
    });
    const filenames = [path.join(srcDir, 'index.js')];
    compiling = true;
    const watcher = await runBuildWatch(
      { rootDir: srcDir, filenames, distDir, watchDir: srcDir },
      {},
      emitter,
    );
    compiling = false;
    watcher.on('ready', () => {
      fs.ensureFileSync(path.join(srcDir, 'far.js'));
      compiling = true;
    });
  });

  it('runBuildWatch and fail', async done => {
    const emitter = new BuildWatchEmitter();
    emitter.on(BuildWatchEvent.firstCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(1);
    });
    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(2);
      watcher.close();
      done();
    });
    const filenames = [path.join(srcDir, 'error')];
    const watcher = await runBuildWatch(
      { rootDir: srcDir, filenames, distDir, watchDir: srcDir },
      {},
      emitter,
    );
    watcher.on('ready', () => {
      fs.ensureFileSync(path.join(srcDir, 'error1.js'));
      fs.writeFileSync(path.join(srcDir, 'error1.js'), 'conta a = 1');
    });
  });

  it('buildWatch and success', async done => {
    const emitter = buildWatch({
      rootDir: srcDir,
      watchDir: srcDir,
      filenames: [path.join(srcDir, 'index.js')],
      distDir,
      enableVirtualDist: true,
      clean: true,
    });
    let compiling = false;
    emitter.on(BuildWatchEvent.compiling, () => {
      expect(compiling).toBe(true);
    });
    emitter.on(BuildWatchEvent.firstCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(0);
      expect(result.virtualDists?.length).toBe(1);
    });
    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(0);
      expect(result.virtualDists?.length).toBe(1);
      expect(result.virtualDists![0].distPath.includes('far.js')).toBe(true);
      watcher?.close();
      done();
    });

    compiling = true;
    const watcher = await emitter.watch();
    compiling = false;
    if (watcher) {
      watcher.on('ready', () => {
        fs.ensureFileSync(path.join(srcDir, 'far.js'));
        compiling = true;
      });
    }
  });

  it('buildWatch and fail', async done => {
    const emitter = buildWatch({
      rootDir: srcDir,
      watchDir: srcDir,
      filenames: [path.join(srcDir, 'error')],
      distDir,
      enableVirtualDist: true,
      clean: true,
    });
    let compiling = false;
    emitter.on(BuildWatchEvent.compiling, () => {
      expect(compiling).toBe(true);
    });
    emitter.on(BuildWatchEvent.firstCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(1);
    });
    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(2);
      watcher?.close();
      done();
    });

    compiling = true;
    const watcher = await emitter.watch();
    compiling = false;
    if (watcher) {
      watcher.on('ready', () => {
        fs.ensureFileSync(path.join(srcDir, 'error1.js'));
        fs.writeFileSync(path.join(srcDir, 'error1.js'), 'cast a = 1;');
        compiling = true;
      });
    }
  });

  it('buildWatch and remove file', async done => {
    const emitter = buildWatch({
      rootDir: srcDir,
      watchDir: srcDir,
      filenames: [path.join(srcDir, 'index.js')],
      distDir,
      enableVirtualDist: true,
      clean: true,
      quiet: true,
    });

    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(0);
      expect(result.message.includes('remove file')).toBe(true);
      expect(result.removeFiles?.length).toBe(1);
      watcher?.close();
      done();
    });

    fs.ensureFileSync(path.join(srcDir, 'far.js'));
    const watcher = await emitter.watch();

    if (watcher) {
      watcher.on('ready', () => {
        fs.removeSync(path.join(srcDir, 'far.js'));
      });
    }
  });

  it('buildWatch and reRight file', async done => {
    fs.ensureFileSync(path.join(srcDir, 'error1.js'));
    fs.writeFileSync(path.join(srcDir, 'error1.js'), 'cast a = 1;');
    const emitter = buildWatch({
      rootDir: srcDir,
      watchDir: srcDir,
      filenames: [path.join(srcDir, 'error'), path.join(srcDir, 'error1.js')],
      distDir,
      enableVirtualDist: true,
      clean: true,
    });

    emitter.on(BuildWatchEvent.firstCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(2);
    });
    emitter.on(BuildWatchEvent.watchingCompiler, (result: ICompilerResult) => {
      expect(result.code).toBe(1);
      expect(result.messageDetails?.length).toBe(1);
      watcher?.close();
      done();
    });

    const watcher = await emitter.watch();
    if (watcher) {
      watcher.on('ready', () => {
        fs.writeFileSync(path.join(srcDir, 'error1.js'), 'const a = 1;');
      });
    }
  });

  afterEach(() => {
    logger.info = originalLogInfo;
    logger.error = originalLogError;
    testLogs = [];
    fs.removeSync(path.join(srcDir, 'far.js'));
    fs.removeSync(path.join(srcDir, 'error1.js'));
  });
});
