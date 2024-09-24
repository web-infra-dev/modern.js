import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  BaseGenerator,
  ChangesetGenerator,
  Language,
  type PackageManager,
  PackagesGenerator,
  Solution,
  i18n as commonI18n,
  getModuleSchema,
} from '@modern-js/generator-common';
import {
  getAllPackages,
  getGeneratorPath,
  getModernVersion,
  getModuleProjectPath,
  getPackageManagerText,
  i18n as utilsI18n,
  validatePackageName,
  validatePackagePath,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const {
    isMonorepoSubProject,
    isLocalPackages,
    projectDir = '',
  } = context.config;

  const { outputPath } = generator;

  let packages: string[] = [];

  if (isMonorepoSubProject && !isLocalPackages) {
    try {
      packages = getAllPackages(outputPath);
    } catch (e) {
      generator.logger.debug(`❗️ [Get All Packages Error]: ${e}`);
      generator.logger.warn(`🟡 ${i18n.t(localeKeys.get_packages_error)}`);
    }
  }

  const { hasPlugin, generatorPlugin, ...extra } = context.config;
  let ans: Record<string, unknown> = {};

  if (hasPlugin) {
    await generatorPlugin.installPlugins(Solution.Module, extra);
    const schema = generatorPlugin.getInputSchema();
    const inputValue = generatorPlugin.getInputValue();
    const defaultConfig = generatorPlugin.getDefaultConfig();
    context.config.gitCommitMessage =
      generatorPlugin.getGitMessage() || context.config.gitCommitMessage;
    ans = await appApi.getInputBySchema(
      schema,
      'formily',
      { ...context.config, ...defaultConfig },
      {
        packageName: input =>
          validatePackageName(input as string, packages, {
            isMonorepoSubProject,
          }),
        packagePath: input =>
          validatePackagePath(
            input as string,
            path.join(process.cwd(), projectDir),
          ),
      },
      {
        ...inputValue,
        packageName: isMonorepoSubProject
          ? undefined
          : path.basename(outputPath),
      },
    );
  } else {
    ans = await appApi.getInputBySchemaFunc(
      getModuleSchema,
      context.config,
      {
        packageName: input =>
          validatePackageName(input as string, packages, {
            isMonorepoSubProject,
          }),
        packagePath: input =>
          validatePackagePath(
            input as string,
            path.join(process.cwd(), projectDir),
          ),
      },
      {
        packageName: isMonorepoSubProject
          ? undefined
          : path.basename(outputPath),
      },
    );
  }

  generator.logger?.timing(`🕐 Get Modern.js module-tools version`);
  const modernVersion = await getModernVersion(
    Solution.Module,
    context.config.registry,
    context.config.distTag,
  );
  generator.logger?.timing(`🕐 Get Modern.js module-tools version`, true);

  generator.logger.debug(`💡 [Input Answer]: ${JSON.stringify(ans)}`);

  const { packageName, packagePath, language, packageManager } = ans;

  const moduleProjectPath = getModuleProjectPath(
    packagePath as string,
    isMonorepoSubProject,
    isLocalPackages,
  );
  const projectPath = projectDir
    ? path.join(projectDir, moduleProjectPath)
    : moduleProjectPath;

  if (!isMonorepoSubProject) {
    await appApi.runSubGenerator(
      getGeneratorPath(BaseGenerator, context.config.distTag, [__dirname]),
      undefined,
      { ...context.config, hasPlugin: false },
    );
  }

  await appApi.forgeTemplate(
    'templates/base-template/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/base-template/', projectPath)
        .replace('language', language as string)
        .replace('.handlebars', ''),
    {
      name: packageName as string,
      language,
      isTs: language === Language.TS,
      packageManager: getPackageManagerText(packageManager as PackageManager),
      isMonorepoSubProject,
      modernVersion,
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
    );
  } else {
    await appApi.forgeTemplate(
      'templates/js-template/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/js-template/', projectPath)
          .replace('.handlebars', ''),
    );
  }

  if (!isMonorepoSubProject) {
    await appApi.runSubGenerator(
      getGeneratorPath(ChangesetGenerator, context.config.distTag, [__dirname]),
    );
  }

  if (isMonorepoSubProject && !isLocalPackages) {
    await appApi.updateWorkspace({
      name: packagePath as string,
      path: projectPath,
    });
  }

  const { packagesInfo } = context.config;
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

  const { locale, isSubGenerator, successInfo } = context.config;
  i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });
  utilsI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Module Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  let projectPath = '';
  try {
    ({ projectPath } = await handleTemplateFile(context, generator, appApi));
  } catch (e) {
    generator.logger.error(`🔴 [Handle Module Template Error]:`, e);
    process.exit(1);
  }

  if (isSubGenerator) {
    return;
  }

  if (context.handleForged) {
    await context.handleForged(
      Solution.Module,
      context,
      context.config.hasPlugin,
      projectPath,
    );
  }

  try {
    await appApi.runGitAndInstall(context.config.gitCommitMessage);
  } catch (e) {
    process.exit(1);
  }

  appApi.showSuccessInfo(
    successInfo ||
      i18n.t(localeKeys.success, {
        packageManager: getPackageManagerText(context.config.packageManager),
      }),
  );

  generator.logger.debug(`🌟 [End Run Module Generator]`);
};
