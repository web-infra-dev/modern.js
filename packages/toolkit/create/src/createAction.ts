import path from 'path';
import { CodeSmith, type Logger } from '@modern-js/codesmith';
import { ora } from '@modern-js/codesmith-utils/ora';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { version as pkgVersion } from '../package.json';
import { i18n, localeKeys } from './locale';
import { createDir } from './utils';

interface Options {
  mwa?: boolean;
  debug?: boolean;
  config?: string;
  packages?: string;
  registry?: string;
  distTag?: string;
  needInstall?: boolean;
  version?: boolean;
  lang?: string;
  time?: boolean;
}

type RunnerTask = Array<{
  name: string;
  config: Record<string, any>;
}>;

const MWA_GENERATOR = '@modern-js/mwa-generator';

function getDefaultConfig(
  projectDir: string = path.basename(process.cwd()),
  options: Options = {},
  logger?: Logger,
) {
  const { mwa, config, packages, registry, distTag, needInstall, lang } =
    options;

  let initialConfig: Record<string, unknown> = {};

  try {
    if (config) {
      initialConfig = JSON.parse(config);
    }
  } catch (e) {
    logger!.error('config parameter format is incorrect');
    logger!.debug('parse initial config error: ', e);
    process.exit(1);
  }

  if (!initialConfig.locale) {
    initialConfig.locale = lang || getLocaleLanguage();
  }

  if (mwa) {
    initialConfig.defaultSolution = 'mwa';
  }

  if (registry) {
    initialConfig.registry = registry;
  }

  if (distTag) {
    initialConfig.distTag = distTag;
  }

  initialConfig.defaultBranch = initialConfig.defaultBranch || 'main';

  if (!needInstall) {
    initialConfig.noNeedInstall = true;
  }

  try {
    if (packages) {
      const packagesInfo = JSON.parse(packages);
      initialConfig.packagesInfo = packagesInfo;
    }
  } catch (e) {
    logger!.error('packages parameter format is incorrect');
    logger!.debug('parse packages error: ', e);
    process.exit(1);
  }

  if (process.env.MODERN_NO_INSTALL) {
    initialConfig.noNeedInstall = true;
  }

  return initialConfig;
}

export async function createAction(projectDir: string, options: Options) {
  const { lang, version, debug, registry, distTag, time } = options;
  const smith = new CodeSmith({
    debug,
    time,
    namespace: 'create',
    registryUrl: registry === '' ? undefined : registry,
  });

  if (lang) {
    i18n.changeLanguage({ locale: lang });
  }
  if (version) {
    smith.logger.info(`@modern-js/create v${pkgVersion}`);
    return;
  }

  smith.logger?.timing('🕒 Run Create Tools');
  const spinner = ora({
    text: 'Load Generator...',
    spinner: 'runner',
  }).start();
  const prepareGlobalPromise = smith.prepareGlobal();

  const prepareGeneratorPromise = smith.prepareGenerators([
    `@modern-js/base-generator@${distTag || 'latest'}`,
    `@modern-js/mwa-generator@${distTag || 'latest'}`,
    `@modern-js/entry-generator@${distTag || 'latest'}`,
  ]);

  smith.logger.debug('📦 @modern-js/create:', `v${pkgVersion}`);
  smith.logger.debug('💡 [Current Dir]:', projectDir || '');
  smith.logger.debug('💡 [Current Config]:', JSON.stringify(options));

  let pwd = process.cwd();
  try {
    pwd = projectDir ? createDir(projectDir, pwd) : pwd;
  } catch (e) {
    smith.logger.error(
      i18n.t(localeKeys.tooltip.dir_exists, { dirName: projectDir }),
    );
    smith.logger?.timing('🕒 Run Create Tools', true);
    process.exit(1);
  }

  const config = getDefaultConfig(projectDir, options, smith.logger);

  let generator = MWA_GENERATOR;

  if (
    process.env.CODESMITH_ENV === 'development' &&
    generator === MWA_GENERATOR
  ) {
    generator = require.resolve(MWA_GENERATOR);
  } else if (!path.isAbsolute(generator) && distTag) {
    generator = `${generator}@${distTag}`;
    await prepareGeneratorPromise;
  }

  await prepareGlobalPromise;

  spinner.stop();

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
    smith.logger?.timing('🕒 Run Create Tools', true);
    process.exit(1);
  }

  if (projectDir) {
    smith.logger.info(
      i18n.t(localeKeys.tooltip.dir_entry, { dirName: projectDir }),
    );
  }
  smith.logger?.timing('🕒 Run Create Tools', true);
}
