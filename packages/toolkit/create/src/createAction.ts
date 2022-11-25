import path from 'path';
import { CodeSmith, Logger } from '@modern-js/codesmith';
import { version as pkgVersion } from '../package.json';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage, createDir } from './utils';

interface Options {
  mwa?: boolean;
  module: boolean;
  monorepo?: boolean;
  debug?: boolean;
  config?: string;
  packages?: string;
  registry?: string;
  distTag?: string;
  plugin?: string[];
  generator?: string;
  needInstall?: boolean;
  version?: boolean;
  lang?: string;
}

type RunnerTask = Array<{
  name: string;
  config: Record<string, any>;
}>;

const REPO_GENERATOR = '@modern-js/repo-generator';

function getDefaultConfig(
  projectDir: string = path.basename(process.cwd()),
  options: Options,
  logger: Logger,
) {
  const {
    mwa,
    module,
    monorepo,
    config,
    packages,
    registry,
    distTag,
    plugin,
    needInstall,
    lang,
  } = options;

  let initialConfig: Record<string, unknown> = {};

  try {
    if (config) {
      initialConfig = JSON.parse(config);
    }
  } catch (e) {
    logger.error('config parameter format is incorrect');
    logger.debug('parse initial config error: ', e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  if (!initialConfig.locale) {
    initialConfig.locale = lang || getLocaleLanguage();
  }

  if (mwa) {
    initialConfig.defaultSolution = 'mwa';
  }

  if (module) {
    initialConfig.defaultSolution = 'module';
    if (!initialConfig.packageName) {
      initialConfig.packageName = projectDir;
    }
  }

  if (monorepo) {
    initialConfig.defaultSolution = 'monorepo';
  }

  if (registry) {
    initialConfig.registry = registry;
  }

  if (distTag) {
    initialConfig.distTag = distTag;
  }

  initialConfig.defaultBranch = initialConfig.defaultBranch || 'main';

  if (plugin) {
    initialConfig.plugins = plugin;
  }

  if (!needInstall) {
    initialConfig.noNeedInstall = true;
  }

  try {
    if (packages) {
      const packagesInfo = JSON.parse(packages);
      initialConfig.packagesInfo = packagesInfo;
    }
  } catch (e) {
    logger.error('packages parameter format is incorrect');
    logger.debug('parse packages error: ', e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  // let generatorPlugin = GENERATOR_PLUGIN;

  // if (process.env.CODESMITH_ENV === 'development') {
  //   generatorPlugin = path.join(
  //     require.resolve(GENERATOR_PLUGIN),
  //     '../../../../',
  //   );
  // }

  // initialConfig.plugins = [
  //   ...((initialConfig.plugins as string[]) || []),
  //   generatorPlugin,
  // ];

  if (process.env.EDENX_NO_INSTALL) {
    initialConfig.noNeedInstall = true;
  }

  return initialConfig;
}

export async function createAction(projectDir: string, options: Options) {
  const {
    lang,
    version,
    debug,
    registry,
    distTag,
    generator: customGenerator,
  } = options;
  const smith = new CodeSmith({
    debug,
    registryUrl: registry,
  });

  if (lang) {
    i18n.changeLanguage({ locale: lang });
  }
  if (version) {
    smith.logger.info('@modern-js/create', `v${pkgVersion}`);
    return;
  }

  smith.logger.debug('@modern-js/create', projectDir || '', options);

  let pwd = process.cwd();
  try {
    pwd = projectDir ? createDir(projectDir, pwd) : pwd;
  } catch (e) {
    smith.logger.error(
      i18n.t(localeKeys.tooltip.dir_exists, { dirName: projectDir }),
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  const config = getDefaultConfig(projectDir, options, smith.logger);

  let generator = customGenerator || REPO_GENERATOR;

  if (
    process.env.CODESMITH_ENV === 'development' &&
    generator === REPO_GENERATOR
  ) {
    generator = require.resolve(REPO_GENERATOR);
  } else if (!path.isAbsolute(generator) && distTag) {
    generator = `${generator}@${distTag}`;
  }

  const task: RunnerTask = [
    {
      name: generator,
      config,
    },
  ];

  try {
    await smith.forge({
      tasks: task.map(runner => ({
        generator: runner.name,
        config: runner.config,
      })),
      pwd,
    });
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  if (projectDir) {
    smith.logger.info(
      i18n.t(localeKeys.tooltip.dir_entry, { dirName: projectDir }),
    );
  }
}
