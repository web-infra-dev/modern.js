import path from 'path';
import { merge } from '@modern-js/utils/lodash';
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
  plugin?: string[];
  cwd?: string;
}

const REPO_GENERATOR = '@modern-js/repo-generator';

export const MonorepoNewAction = async (options: IMonorepoNewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    plugin = [],
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

  // Determine if the plugin is a Monorepo dependency
  const plugins = plugin.map(plugin => {
    try {
      return path.join(require.resolve(plugin), '../../../../');
    } catch (e) {
      return plugin;
    }
  });

  const finalConfig = merge(UserConfig, {
    locale: (UserConfig.locale as string) || locale,
    packageManager: UserConfig.packageManager || (await getPackageManager(cwd)),
    isMonorepo: true,
    distTag,
    plugins,
  });

  let generator = REPO_GENERATOR;
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
