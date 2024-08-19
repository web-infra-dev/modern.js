import type { Stats } from 'fs';
import path from 'path';
import { chalk, logger, chokidar } from '@modern-js/utils';
import type { ICompiler } from '../../types';

export const initWatcher = (compiler: ICompiler) => {
  const { config, api } = compiler;
  const watch = chokidar.watch([compiler.context.root], {
    useFsEvents: false, // disable fsevents due to fsevents hoist problem
    ignored: [
      '**/node_modules',
      '**/.gitignore',
      '**/.git',
      compiler.config.outDir,
    ],
    cwd: compiler.context.root,
  });
  compiler.watcher = watch;
  let running = false;
  let needReRun = false;

  const handleLink = async (filePath: string, type: 'add' | 'unlink') => {
    const {
      config,
      context: { root },
    } = compiler;
    const { buildType, input, sourceDir } = config;
    const absFilePath = path.resolve(root, filePath);
    let shouldRebuild = false;
    if (buildType === 'bundleless' && Array.isArray(input)) {
      if (type === 'add') {
        shouldRebuild = absFilePath.startsWith(sourceDir);
      } else {
        shouldRebuild = input.some(item => item === filePath);
      }
    }
    if (shouldRebuild) {
      const text = type === 'add' ? 'added' : 'unlinked';
      logger.info(`${chalk.underline(filePath)} ${text}`);
      if (type === 'unlink') {
        (input as string[]).splice((input as string[]).indexOf(filePath), 1);
      } else {
        (input as string[]).push(filePath);
      }
      if (running) {
        needReRun = true;
      } else {
        running = true;
        await compiler.reBuild('link', config);
        running = false;
        if (needReRun) {
          needReRun = false;
          await compiler.reBuild('link', config);
        }
      }
    }
  };
  const handleAdd = async (filePath: string) => {
    return handleLink(filePath, 'add');
  };
  const handleUnlink = async (filePath: string) => {
    return handleLink(filePath, 'unlink');
  };

  const handleChange = async (filePath: string, _events: Stats) => {
    const {
      context: { root },
      watchedFiles,
    } = compiler;
    if (watchedFiles.has(path.resolve(root, filePath))) {
      logger.info(`File changed: ${chalk.dim(filePath)}`);
      const runner = api.useHookRunners();
      runner.buildWatchJs({ buildConfig: config });
      await compiler.reBuild('change', config);
    }
  };
  watch.on('ready', () => {
    watch.on('change', handleChange);
    watch.on('add', handleAdd);
    watch.on('unlink', handleUnlink);
  });
  watch.once('restart', () => {
    watch.removeListener('change', handleChange);
  });
};
