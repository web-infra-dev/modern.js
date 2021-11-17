import { CodeSmith, Logger } from '@modern-js/codesmith';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage, createDir } from './utils';

interface Options {
  mwa?: boolean;
  library: boolean;
  monorepo?: boolean;
  debug?: boolean;
  config?: string;
  registry?: string;
  distTag?: string;
}

type RunnerTask = Array<{
  name: string;
  config: Record<string, any>;
}>;

const REPO_GENERAROE = '@modern-js/repo-generator';

// eslint-disable-next-line max-statements
function getDefaultConfing(options: Options, logger: Logger) {
  const { mwa, library, monorepo, config, registry, distTag } = options;

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
    initialConfig.locale = getLocaleLanguage();
  }

  if (mwa) {
    initialConfig.solution = 'mwa';
  }

  if (library) {
    initialConfig.solution = 'library';
  }

  if (monorepo) {
    initialConfig.solution = 'monorepo';
  }

  if (registry) {
    initialConfig.registry = registry;
  }

  if (distTag) {
    initialConfig.distTag = distTag;
  }

  initialConfig.defaultBranch = initialConfig.defaultBranch || 'main';

  return initialConfig;
}

export async function createAction(projectDir: string, options: Options) {
  const { debug, registry, distTag } = options;
  const smith = new CodeSmith({
    debug,
    registryUrl: registry,
  });

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

  const config = getDefaultConfing(options, smith.logger);

  let generator = REPO_GENERAROE;

  if (process.env.CODESMITH_ENV === 'development') {
    generator = require.resolve(REPO_GENERAROE);
  } else if (distTag) {
    generator = `${REPO_GENERAROE}@${distTag}`;
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
