import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { Language } from '@modern-js/generator-common';
import { isTsProject } from '@modern-js/generator-utils';

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
) => {
  const appDir = context.materials.default.basePath;
  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  const {
    onlyApp = false,
    dirs = [],
    appExtend = '@modern-js-app',
  } = context.config.eslintConfig || {};

  for (const dir of dirs) {
    if (!onlyApp && language === Language.TS) {
      await appApi.forgeTemplate(
        'templates/ts-template/**/*',
        undefined,
        resourceKey =>
          resourceKey
            .replace('templates/ts-template/', `${dir}/`)
            .replace('.handlebars', ``),
        {
          extends: appExtend,
        },
      );
    } else {
      appApi.forgeTemplate(
        'templates/js-template/**/*',
        undefined,
        resourceKey =>
          resourceKey
            .replace('templates/js-template/', `${dir}/`)
            .replace('.handlebars', ``),
        {
          extends: appExtend,
        },
      );
    }
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/eslint-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, appApi);

  generator.logger.debug(`forge @modern-js/eslint-generator succeed `);
};
