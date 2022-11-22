import os from 'os';
import path from 'path';
import { fs, ora } from '@modern-js/utils';
import { i18n, localeKeys } from './locale';

export async function cleanCacheAction() {
  const tmpDir = os.tmpdir();
  const spinner = ora('Loading...').start();
  spinner.color = 'yellow';
  const cacheDir = path.join(tmpDir, 'csmith-generator');
  fs.emptyDirSync(cacheDir);
  spinner.stop();
  console.info(`[INFO] ${i18n.t(localeKeys.tooltip.clean_cache_success)}`);
}
