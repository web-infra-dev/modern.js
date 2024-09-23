import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  DependenceGenerator,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import {
  getGeneratorPath,
  getPackageManager,
  getPackageManagerText,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
  _generator: GeneratorCore,
) => {
  await appApi.forgeTemplate('templates/docs/**/*', undefined, resourceKey =>
    resourceKey.replace('templates/', '').replace('.handlebars', ''),
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Module Doc Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  await handleTemplateFile(context, appApi, generator);

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag, [__dirname]),
    undefined,
    context.config,
  );

  const appDir = context.materials.default.basePath;
  const packageManager =
    context.config.packageManager || (await getPackageManager(appDir));

  appApi.showSuccessInfo(
    i18n.t(localeKeys.success, {
      packageManager: getPackageManagerText(packageManager),
    }),
  );

  generator.logger.debug(`🌟 [End Run Module Doc Generator]`);
};
