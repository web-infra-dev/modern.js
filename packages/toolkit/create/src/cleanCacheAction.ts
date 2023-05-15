import os from 'os';
import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import ora from '@modern-js/utils/ora';
import { i18n, localeKeys } from './locale';

export async function cleanCacheAction() {
  const tmpDir = os.tmpdir();
  const spinner = ora({
    text: 'Load Generator...',
    spinner: 'runner',
  }).start();
  const cacheDir = path.join(tmpDir, 'csmith-generator');
  fs.emptyDirSync(cacheDir);
  spinner.stop();
  console.info(`[INFO] ${i18n.t(localeKeys.tooltip.clean_cache_success)}`);
}
