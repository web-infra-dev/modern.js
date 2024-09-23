import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { i18n } from '@modern-js/generator-common';

const handleTemplateFile = async (
  appApi: AppAPI,
  context: GeneratorContext,
) => {
  await appApi.forgeTemplate('templates/**/*', undefined, undefined, {
    defaultBranch: context.config.defaultBranch || 'master',
  });
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Changeset Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  await handleTemplateFile(appApi, context);

  generator.logger.debug(`🌟 [End Run Changeset Generator]`);
};
