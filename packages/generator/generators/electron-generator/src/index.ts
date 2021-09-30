import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { isTsProject } from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const isTs = isTsProject(context.materials.default.basePath);
  await appApi.forgeTemplate(
    'templates/base-template/**/*',
    undefined,
    (resourceKey: string) =>
      resourceKey
        .replace('templates/base-template/', '')
        .replace('.handlebars', isTs ? '.ts' : '.js'),
  );

  if (isTs) {
    await appApi.forgeTemplate(
      'templates/ts-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/ts-template/', '')
          .replace('.handlebars', isTs ? 'ts' : 'js'),
    );
  }

  const updateInfo = {
    main: './electron/main.js',
    'scripts.dev:main': 'modern dev electron-main',
    'scripts.build:main': 'modern build electron-main',
    'scripts.build:app': 'modern build electron-app',
    'dependencies.@modern-js/electron-bridge': '0.0.1-alpha.191',
    'dependencies.@modern-js/electron-runtime': '0.0.1-alpha.191',
    'devDependencies.@modern-js/plugin-electron': '0.0.1-alpha.191',
  };

  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: { $set: updateInfo },
  });
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/electron-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  if (!context.config.isSubGenerator) {
    try {
      await appApi.runInstall();
    } catch (e) {
      generator.logger.error(e);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  appApi.showSuccessInfo(i18n.t(localeKeys.success));

  generator.logger.debug(`forge @modern-js/electron-generator succeed `);
};
