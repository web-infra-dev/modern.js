import { merge } from 'lodash';
import { CodeSmith } from '@modern-js/codesmith';
import { i18n } from '@modern-js/generator-common';
import { getPackageManager } from '@modern-js/generator-utils';
import { alreadyRepo } from './utils';

interface IMonorepoNewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  plugins?: string[];
  cwd?: string;
}

const REPO_GENERAROE = '@modern-js/repo-generator';

export const MonorepoNewAction = async (options: IMonorepoNewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    plugins = [],
    cwd = process.cwd(),
  } = options;

  let UserConfig: Record<string, unknown> = {};

  try {
    UserConfig = JSON.parse(config);
  } catch (e) {
    throw new Error('config is not a valid json');
  }

  i18n.changeLanguage({ locale: (UserConfig.locale as string) || locale });

  const smith = new CodeSmith({
    debug,
    registryUrl: registry,
  });

  if (!alreadyRepo(cwd)) {
    smith.logger.warn('not valid modern.js repo');
  }

  const finalConfig = merge(UserConfig, {
    locale: (UserConfig.locale as string) || locale,
    packageManager: getPackageManager(cwd),
    isMonorepo: true,
    distTag,
    plugins,
  });

  let generator = REPO_GENERAROE;
  if (process.env.CODESMITH_ENV === 'development') {
    generator = require.resolve(generator);
  } else if (distTag) {
    generator = `${generator}@${distTag}`;
  }

  const task = [
    {
      name: generator,
      config: finalConfig,
    },
  ];

  await smith.forge({
    tasks: task.map(runner => ({
      generator: runner.name,
      config: runner.config,
    })),
    pwd: cwd,
  });
};
