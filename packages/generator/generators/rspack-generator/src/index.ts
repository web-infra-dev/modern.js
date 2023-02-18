import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  chalk,
  getModernConfigFile,
  getModernPluginVersion,
  isTsProject,
} from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
  Language,
  Solution,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const handleTemplateFile = async (
  context: GeneratorContext,
  _generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { isNewProject, modernVersion } = context.config;
  if (isNewProject) {
    const appDir = context.materials.default.basePath;
    const language = isTsProject(appDir) ? Language.TS : Language.JS;
    appApi.forgeTemplate(
      language === Language.TS
        ? 'templates/modern.config.ts.handlebars'
        : 'templates/js/modern.config.js.handlebars',
      undefined,
      resourceKey =>
        resourceKey.replace('templates/', '').replace('.handlebars', ''),
    );
  }

  const rspackProviderName = '@modern-js/builder-rspack-provider';
  const getRspackProviderVersion = () => {
    return getModernPluginVersion(Solution.MWA, rspackProviderName, {
      registry: context.config.registry,
      distTag: context.config.distTag,
      cwd: context.materials.default.basePath,
    });
  };
  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      isSubGenerator: true,
      devDependencies: {
        [rspackProviderName]:
          modernVersion || (await getRspackProviderVersion()),
      },
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/rspack-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  if (!context.config.isSubGenerator) {
    await appApi.runInstall(undefined, { ignoreScripts: true });
    const appDir = context.materials.default.basePath;
    const configFile = await getModernConfigFile(appDir);
    const isTS = configFile.endsWith('ts');
    console.info(
      chalk.green(`\n[INFO]`),
      `${i18n.t(localeKeys.success)}`,
      chalk.yellow.bold(`${configFile}`),
      ':',
      '\n',
    );
    if (isTS) {
      console.info(`
export default defineConfig${chalk.yellow.bold("<'rspack'>")}({
  ...,
  plugins: [appTools(${chalk.yellow.bold(
    `{bundler: 'experimental-rspack'}`,
  )}), ...],
});
`);
    } else {
      console.info(`
module.exports = {
  ...,
  plugins: [appTools(${chalk.yellow.bold(
    `{bundler: 'experimental-rspack'}`,
  )}), ...],
};
`);
    }
  }
  generator.logger.debug(`forge @modern-js/rspack-generator succeed `);
};
