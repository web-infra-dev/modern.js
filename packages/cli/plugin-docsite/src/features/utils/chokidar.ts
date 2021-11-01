import path from 'path';
import { logger } from '@modern-js/utils';
import chokidar from 'chokidar';
import glob from 'glob';
import { generateFiles } from './generate-files';

export function chokidarFile(
  appDirectory: string,
  tmpDir: string,
  isDev: boolean,
) {
  let dirty = false;
  let building = false;
  chokidar
    .watch('docs/**/*.{md,mdx}', {
      cwd: appDirectory,
      ignoreInitial: true,
    })
    .on('all', async () => {
      if (building) {
        dirty = true;
      } else {
        building = true;
        dirty = false;

        logger.info('changed, collect and rebuild docs');
        const files = glob.sync('**/*.{md,mdx}', {
          cwd: path.resolve(appDirectory, 'docs'),
          ignore: '**/_*',
        });

        if (files.length) {
          await generateFiles(appDirectory, tmpDir, files, isDev);
          logger.info('built');
        }
        // eslint-disable-next-line require-atomic-updates
        building = false;

        if (dirty) {
          await generateFiles(appDirectory, tmpDir, files, isDev);
        }
      }
    });
}
