import * as path from 'path';
import * as Event from 'events';
import { logger, watch, FSWatcher, WatchChangeType } from '@modern-js/utils';
import { build } from './build';
import { CompilerErrorResult } from './compilerErrorResult';
import type {
  IFinaleCompilerOptions,
  BabelOptions,
  ICompilerResult,
} from './type';

export const BuildWatchEvent = {
  firstCompiler: 'first-compiler',
  compiling: 'compiling',
  watchingCompiler: 'watching-compiler',
};

export class BuildWatchEmitter extends Event.EventEmitter {
  private _initFn!: (
    emitter: BuildWatchEmitter,
  ) => Promise<FSWatcher> | FSWatcher;

  setInitFn(fn: (emitter: BuildWatchEmitter) => Promise<any> | any) {
    this._initFn = fn;
  }

  async watch() {
    if (typeof this._initFn === 'function') {
      return this._initFn(this);
    }

    return null;
  }
}

export const runBuildWatch = async (
  option: IFinaleCompilerOptions,
  babelConfig: BabelOptions = {},
  emitter: BuildWatchEmitter,
) => {
  emitter.emit(BuildWatchEvent.compiling);
  const errorResult = new CompilerErrorResult();
  const watchDir = option.watchDir as string;
  const { distDir, quiet } = option;
  // 第一次正常构建
  const firstBuildResult = await build(option, babelConfig);

  const { code } = firstBuildResult;
  if (code === 1) {
    errorResult.init(firstBuildResult);
    emitter.emit(BuildWatchEvent.firstCompiler, errorResult.value);
  } else {
    emitter.emit(BuildWatchEvent.firstCompiler, firstBuildResult);
  }

  return watch(
    `${watchDir}/**/*.{js,jsx,ts,tsx}`,
    async ({ changeType, changedFilePath }) => {
      emitter.emit(BuildWatchEvent.compiling);
      if (changeType === WatchChangeType.UNLINK) {
        const removeFiles = [
          path.normalize(
            `./${distDir}/${path.relative(watchDir, changedFilePath)}`,
          ),
        ];
        if (!quiet) {
          logger.info(`remove file: ${removeFiles.join(',')}`);
        }
        const result: ICompilerResult = {
          code: 0,
          message: `remove file: ${removeFiles.join(',')}`,
          removeFiles,
        };
        emitter.emit(BuildWatchEvent.watchingCompiler, result);
        return;
      }

      const result = await build(
        { ...option, filenames: [changedFilePath] },
        babelConfig,
      );
      if (result.code === 1) {
        errorResult.update(result.messageDetails || []);
        emitter.emit(BuildWatchEvent.watchingCompiler, errorResult.value);
        !quiet && logger.info(errorResult.value.message);
      } else {
        errorResult.removeByFileName(changedFilePath);
        // 如果该文件没有报错，则更新该文件状态并检查是否还存在其他报错文件
        if (errorResult.checkExistError()) {
          emitter.emit(BuildWatchEvent.watchingCompiler, {
            ...errorResult.value,
            virtualDists: result.virtualDists,
          } as ICompilerResult);
          !quiet && logger.info(errorResult.value.message);
        } else {
          emitter.emit(BuildWatchEvent.watchingCompiler, result);
          !quiet && logger.info(result.message);
        }
      }
    },
    [`${watchDir}/**/*.d.ts`],
  );
};

export const buildWatch = (
  option: IFinaleCompilerOptions,
  babelConfig: BabelOptions = {},
) => {
  const buildWatchEmitter = new BuildWatchEmitter();
  buildWatchEmitter.setInitFn(runBuildWatch.bind(null, option, babelConfig));
  return buildWatchEmitter;
};
