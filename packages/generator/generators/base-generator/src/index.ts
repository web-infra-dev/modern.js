import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { BaseSchema } from '@modern-js/generator-common';

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
) => {
  await appApi.getInputBySchema(BaseSchema, context.config);
  await appApi.forgeTemplate(
    'templates/base-templates/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/base-templates/', '')
        .replace('.handlebars', ''),
  );
  await appApi.forgeTemplate('templates/idea/**/*', undefined, resourceKey =>
    resourceKey.replace('templates/idea/', '.idea/'),
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/base-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, appApi);

  if (context.handleForged) {
    await context.handleForged(
      'base-generator',
      context,
      context.config.hasPlugin,
    );
  }

  generator.logger.debug(`forge @modern-js/base-generator succeed `);
};
