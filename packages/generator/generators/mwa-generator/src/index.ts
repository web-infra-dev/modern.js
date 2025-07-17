import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { merge } from '@modern-js/codesmith-utils/lodash';
import {
  BaseGenerator,
  EntryGenerator,
  Language,
  MWADefaultConfig,
  PackagesGenerator,
  Solution,
  i18n as commonI18n,
  getMWASchema,
} from '@modern-js/generator-common';
import {
  getAllPackages,
  getGeneratorPath,
  getMWAProjectPath,
  getModernVersion,
  getPackageManagerText,
  i18n as utilsI18n,
  validatePackageName,
  validatePackagePath,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const mergeDefaultConfig = (context: GeneratorContext) => {
  const { defaultSolution } = context.config;

  if (defaultSolution) {
    merge(context.config, MWADefaultConfig);
  }
};

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  generator.logger?.timing(`🕐 Get Modern.js app-tools version`);
  const modernVersion = await getModernVersion(
    Solution.MWA,
    context.config.registry,
    context.config.distTag,
  );
  generator.logger?.timing(`🕐 Get Modern.js app-tools version`, true);

  const { isMonorepoSubProject, projectDir = '' } = context.config;

  const { outputPath } = generator;

  let packages: string[] = [];

  if (isMonorepoSubProject) {
    try {
      packages = getAllPackages(outputPath);
    } catch (e) {
      generator.logger.debug(`❗️ [Get All Packages Error]: ${e}`);
      generator.logger.warn(`🟡 ${i18n.t(localeKeys.get_packages_error)}`);
    }
  }

  context.config = {
    ...context.config,
    isMwa: true,
    isEmptySrc: true,
  };

  let ans: Record<string, unknown> = {};

  ans = await appApi.getInputBySchemaFunc(
    getMWASchema,
    { ...context.config },
    {
      packageName: input =>
        validatePackageName(input as string, packages, {
          isMonorepoSubProject,
        }),
      packagePath: input =>
        validatePackagePath(
          input as string,
          path.join(process.cwd(), projectDir),
          { isMwa: true },
        ),
    },
  );

  generator.logger.debug(`💡 [Input Answer]: ${JSON.stringify(ans)}`);

  const { packageName, packagePath, language, packageManager } = ans;
  const { packagesInfo } = context.config;

  const bundler = `'rspack',`;

  const projectPath = getMWAProjectPath(
    packagePath as string,
    isMonorepoSubProject,
  );

  const dirname = path.basename(generator.outputPath);

  await appApi.runSubGenerator(
    getGeneratorPath(BaseGenerator, context.config.distTag, [__dirname]),
    undefined,
    { ...context.config },
  );

  await appApi.forgeTemplate(
    'templates/base-template/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/base-template/', projectPath)
        .replace('.handlebars', ''),
    {
      name: packageName || dirname,
      isMonorepoSubProject,
      modernVersion,
      packageManager,
      isTs: language === Language.TS,
    },
  );

  if (language === Language.TS) {
    await appApi.forgeTemplate(
      'templates/ts-template/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/ts-template/', projectPath)
          .replace('.handlebars', ''),
      {
        bundler,
      },
    );
  } else {
    await appApi.forgeTemplate(
      'templates/js-template/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/js-template/', projectPath)
          .replace('.handlebars', ''),
      {
        bundler,
      },
    );
  }

  await appApi.runSubGenerator(
    getGeneratorPath(EntryGenerator, context.config.distTag, [__dirname]),
    `./${projectPath}`,
    {
      ...context.config,
      isSubGenerator: true,
    },
  );

  if (isMonorepoSubProject) {
    await appApi.updateWorkspace({
      name: packagePath as string,
      path: projectPath,
    });
  }

  if (packagesInfo && Object.keys(packagesInfo).length > 0) {
    await appApi.runSubGenerator(
      getGeneratorPath(PackagesGenerator, context.config.distTag, [__dirname]),
      undefined,
      context.config,
    );
  }

  return { projectPath };
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale, successInfo } = context.config;
  commonI18n.changeLanguage({ locale });
  utilsI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });
  i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run MWA Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  let projectPath = '';
  try {
    mergeDefaultConfig(context);
    ({ projectPath } = await handleTemplateFile(context, generator, appApi));
  } catch (e) {
    generator.logger.error(`🔴 [Handle MWA Template Error]:`, e);
    process.exit(1);
  }

  try {
    await appApi.runGitAndInstall(context.config.gitCommitMessage);
  } catch (e) {
    process.exit(1);
  }

  const { packageManager } = context.config;

  if (successInfo) {
    appApi.showSuccessInfo(successInfo);
  } else {
    appApi.showSuccessInfo(
      i18n.t(localeKeys.success, {
        packageManager: getPackageManagerText(packageManager),
      }),
    );
  }

  generator.logger.debug(`🌟 [End Run MWA Generator]`);
};
