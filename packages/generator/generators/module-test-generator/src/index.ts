import {
  isTsProject,
  getPackageManager,
  getPackageManagerText,
  getGeneratorPath,
} from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  DependenceGenerator,
  i18n as commonI18n,
  Language,
} from '@modern-js/generator-common';
import { localeKeys, i18n } from './locale';

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: { $set: { 'scripts.test': 'modern test' } },
  });

  const appDir = context.materials.default.basePath;
  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  await appApi.forgeTemplate(
    language === Language.TS ? 'templates/ts/**/*' : 'templates/js/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/', '')
        .replace('js/', '')
        .replace('ts/', '')
        .replace('language', language as string)
        .replace('.handlebars', ''),
  );

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag, [__dirname]),
    undefined,
    {
      ...context.config,
      devDependencies: {
        ...(context.config.devDependencies || {}),
        '@types/jest': '~29.2.4',
      },
    },
  );

  const packageManager =
    context.config.packageManager || (await getPackageManager(appDir));

  return {
    packageManager,
  };
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/test-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  const { packageManager } = await handleTemplateFile(
    context,
    generator,
    appApi,
  );

  appApi.showSuccessInfo(
    i18n.t(localeKeys.success, {
      packageManager: getPackageManagerText(packageManager),
    }),
  );

  generator.logger.debug(`forge @modern-js/test-generator succeed `);
};
