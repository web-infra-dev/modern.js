import path from 'path';
import { fs, isTsProject } from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { BFFSchema, BFFType, i18n } from '@modern-js/generator-common';

function isEmptyApiDir(apiDir: string) {
  const files = fs.readdirSync(apiDir);
  if (files.length === 0) {
    return true;
  }
  return files.every(file => {
    const childFiles = fs.readdirSync(path.join(apiDir, file));
    return childFiles.length === 0;
  });
}

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const ans = await appApi.getInputBySchema(BFFSchema, context.config);

  const appDir = context.materials.default.basePath;
  const apiDir = path.join(appDir, 'api');

  if (fs.existsSync(apiDir) && !isEmptyApiDir(apiDir)) {
    const files = fs.readdirSync('api');
    if (files.length > 0) {
      generator.logger.warn("'api' is already exist");
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  const { bffType, bffFramework } = ans;

  const language = isTsProject(appDir) ? 'ts' : 'js';

  if (bffType === BFFType.Func) {
    await appApi.forgeTemplate(
      'templates/function/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/function/', '')
          .replace('.handlebars', `.${language}`),
    );
  } else {
    await appApi.forgeTemplate(
      `templates/${bffFramework as string}/**/*`,
      undefined,
      resourceKey =>
        resourceKey
          .replace(`templates/${bffFramework as string}/`, '')
          .replace('.handlebars', `.${language}`),
    );
  }
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

  generator.logger.debug(`start run @modern-js/bff-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`forge @modern-js/bff-generator succeed `);
};
