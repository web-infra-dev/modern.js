import {
  getMonorepoPackages,
  getPackageManager,
  isMonorepo,
  logger,
} from '@modern-js/utils';
import { i18n, localeKeys } from '../locale';
import { CHANGESET_PATH, execaWithStreamLog } from '../utils';

interface ChangeOptions {
  empty: boolean;
  open: boolean;
}
export async function change(options: ChangeOptions) {
  const appDir = process.cwd();
  if (isMonorepo(appDir)) {
    const packages = getMonorepoPackages(appDir);
    if (packages.length === 0) {
      const packageManager = await getPackageManager(appDir);
      logger.warn(
        i18n.t(localeKeys.command.change.no_packages, {
          packageManager:
            packageManager === 'yarn' ? 'yarn' : `${packageManager} run`,
        }),
      );
      return;
    }
  }
  const { empty, open } = options;
  const params = [CHANGESET_PATH, 'add'];
  if (empty) {
    params.push('--empty');
  }

  if (open) {
    params.push('--open');
  }

  await execaWithStreamLog(process.execPath, params);
}
