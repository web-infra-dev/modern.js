import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';

const handleTemplateFile = async (
  context: GeneratorContext,
  _generator: GeneratorCore,
  appApi: AppAPI,
) => {
  await appApi.forgeTemplate(
    'templates/base-template/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/base-template/', '')
        .replace('.handlebars', ''),
  );

  await appApi.forgeTemplate(
    'templates/pnpm-template/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/pnpm-template/npmrc', '.npmrc')
        .replace('.handlebars', ''),
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Base Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`🌟 [End Run Base Generator]`);
};
