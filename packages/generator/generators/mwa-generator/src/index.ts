import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n as commonI18n,
  BaseGenerator,
  Solution,
  getMWASchema,
  Language,
  EntryGenerator,
  PackagesGenerator,
  BuildTools,
} from '@modern-js/generator-common';
import {
  getMWAProjectPath,
  getAllPackages,
  i18n as utilsI18n,
  validatePackageName,
  validatePackagePath,
  getPackageManagerText,
  getModernVersion,
  getGeneratorPath,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { isMonorepoSubProject, projectDir = '' } = context.config;

  const { outputPath } = generator;

  let packages: string[] = [];

  if (isMonorepoSubProject) {
    try {
      packages = getAllPackages(outputPath);
    } catch (e) {
      generator.logger.debug('get all packages error', e);
      generator.logger.warn(i18n.t(localeKeys.get_packages_error));
    }
  }

  context.config = {
    ...context.config,
    isMwa: true,
    isEmptySrc: true,
  };

  const { hasPlugin, generatorPlugin, ...extra } = context.config;

  let ans: Record<string, unknown> = {};

  if (hasPlugin) {
    await generatorPlugin.installPlugins(Solution.MWA, extra);
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
            {
              isMwa: true,
            },
          ),
      },
      { ...inputValue },
    );
  } else {
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
  }

  const modernVersion = await getModernVersion(
    Solution.MWA,
    context.config.registry,
    context.config.distTag,
  );

  generator.logger.debug(`inputData=${JSON.stringify(ans)}`, ans);

  const { packageName, packagePath, language, packageManager } = ans;
  const { packagesInfo, buildTools } = context.config;

  const bundler =
    buildTools === BuildTools.Rspack
      ? `'experimental-rspack',`
      : `'webpack', // Set to 'experimental-rspack' to enable rspack ⚡️🦀`;

  const projectPath = getMWAProjectPath(
    packagePath as string,
    isMonorepoSubProject,
  );

  const dirname = path.basename(generator.outputPath);

  await appApi.runSubGenerator(
    getGeneratorPath(BaseGenerator, context.config.distTag, [__dirname]),
    undefined,
    { ...context.config, hasPlugin: false },
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
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/mwa-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  let projectPath = '';
  try {
    ({ projectPath } = await handleTemplateFile(context, generator, appApi));
  } catch (e) {
    generator.logger.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  if (context.handleForged) {
    await context.handleForged(
      Solution.MWA,
      context,
      context.config.hasPlugin,
      projectPath,
    );
  }

  try {
    await appApi.runGitAndInstall(context.config.gitCommitMessage);
  } catch (e) {
    generator.logger.error(e);
    // eslint-disable-next-line no-process-exit
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

  generator.logger.debug(`forge @modern-js/mwa-generator succeed `);
};
