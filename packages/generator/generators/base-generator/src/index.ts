import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { getBaseSchema, PackageManager } from '@modern-js/generator-common';
import { fs } from '@modern-js/generator-utils';

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { hasPlugin, generatorPlugin, ...extra } = context.config;

  let ans: Record<string, unknown> = {};
  if (hasPlugin) {
    await generatorPlugin.installPlugins('custom', extra);
    const schema = generatorPlugin.getInputSchema();
    const inputValue = generatorPlugin.getInputValue();
    const defaultConfig = generatorPlugin.getDefaultConfig();
    ans = await appApi.getInputBySchema(
      schema,
      'formily',
      {
        ...context.config,
        ...defaultConfig,
      },
      {},
      { ...inputValue },
    );
  } else {
    ans = await appApi.getInputBySchemaFunc(getBaseSchema, context.config);
  }

  const { packageManager } = ans;

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

  if (packageManager === PackageManager.Pnpm) {
    await appApi.forgeTemplate(
      'templates/pnpm-templates/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/pnpm-templates/npmrc', '.npmrc')
          .replace('.handlebars', ''),
    );
  }

  fs.chmodSync(path.join(generator.outputPath, '.husky', 'pre-commit'), '755');
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

  await handleTemplateFile(context, generator, appApi);

  if (context.handleForged) {
    await context.handleForged('custom', context, context.config.hasPlugin);
  }

  generator.logger.debug(`forge @modern-js/base-generator succeed `);
};
