import type { Stats } from 'fs';
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import micromatch from 'micromatch';
import { glob } from 'glob';
import chalk from 'chalk';
import { LibuildPlugin } from '../types';

export const watchPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:watch';
  let watch: FSWatcher;
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.initialize.tap(pluginName, () => {
        watch = chokidar.watch([compiler.config.root], {
          useFsEvents: false, // disable fsevents due to fsevents hoist problem
          ignored: ['**/node_modules', '**/.gitignore', '**/.git', compiler.config.outdir],
          cwd: compiler.config.root,
        });
        compiler.watcher = watch as FSWatcher;
        let running = false;
        let needReRun = false;

        const handleLink = async (filePath: string, type: 'add' | 'unlink') => {
          const { userConfig, config } = compiler;
          const { input: userInput } = userConfig;
          const { bundle, root, input } = config;
          const absFilePath = path.resolve(root, filePath);
          let shouldRebuild = false;
          if (Array.isArray(userInput) && !bundle) {
            userInput.forEach(async (i) => {
              const absGlob = path.resolve(root, i);
              if (glob.hasMagic(absGlob)) {
                micromatch.isMatch(absFilePath, absGlob) && (shouldRebuild = true);
              } else if (absFilePath.startsWith(absGlob)) {
                shouldRebuild = true;
              }
            });
          }
          if (shouldRebuild) {
            const text = type === 'add' ? 'added' : 'unlinked';
            compiler.config.logger.info(`${chalk.underline(filePath)} ${text}`);
            if (type === 'unlink') {
              (input as string[]).splice((input as string[]).indexOf(filePath), 1);
            } else {
              (input as string[]).push(filePath);
            }
            if (running) {
              needReRun = true;
            } else {
              running = true;
              await compiler.compilation.reBuild('link');
              running = false;
              if (needReRun) {
                needReRun = false;
                await compiler.compilation.reBuild('link');
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

        const handleChange = async (filePath: string, events: Stats, ...args: any[]) => {
          const {
            config: { root },
            watchedFiles,
          } = compiler;
          if (watchedFiles.has(path.resolve(root, filePath))) {
            compiler.config.logger.info(`${chalk.underline(filePath)} changed`);
            compiler.hooks.watchChange.call([filePath]);
            await compiler.compilation.reBuild('change');
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
      });
      compiler.hooks.shutdown.tapPromise('watch', async () => {
        await watch.close();
      });
    },
  };
};
