import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n,
  Language,
  DependenceGenerator,
} from '@modern-js/generator-common';
import { isTsProject, getGeneratorPath } from '@modern-js/generator-utils';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const appDir = context.materials.default.basePath;
  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  if (language === Language.TS) {
    await appApi.forgeTemplate(
      'templates/ts-template/**/*',
      undefined,
      resourceKey => resourceKey.replace('templates/ts-template/', ''),
    );
  } else {
    appApi.forgeTemplate('templates/js-template/**/*', undefined, resourceKey =>
      resourceKey.replace('templates/js-template/', ''),
    );
  }

  const { dependencies, peerDependencies, devDependencies } = context.config;
  const tailwindVersion = '~3.3.3';
  if (dependencies?.tailwindcss) {
    dependencies.tailwindcss = tailwindVersion;
  }
  if (peerDependencies?.tailwindcss) {
    peerDependencies.tailwindcss = tailwindVersion;
  }
  if (devDependencies?.tailwindcss) {
    devDependencies.tailwindcss = tailwindVersion;
  }
  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag, [__dirname]),
    undefined,
    {
      ...context.config,
      dependencies,
      devDependencies,
      peerDependencies,
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/tailwindcss-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`forge @modern-js/tailwindcss-generator succeed `);
};
