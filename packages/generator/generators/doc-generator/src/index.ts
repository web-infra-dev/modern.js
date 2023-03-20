import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n as commonI18n,
  BaseGenerator,
  Solution,
  getDocSchema,
  PackagesGenerator,
} from '@modern-js/generator-common';
import {
  getDocProjectPath,
  getAllPackages,
  i18n as utilsI18n,
  validatePackageName,
  validatePackagePath,
  getPackageManagerText,
  getModernVersion,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

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

  const { hasPlugin, generatorPlugin, ...extra } = context.config;

  let ans: Record<string, unknown> = {};

  if (hasPlugin) {
    await generatorPlugin.installPlugins(Solution.Doc, extra);
    const schema = generatorPlugin.getInputSchema();
    const inputValue = generatorPlugin.getInputValue();
    context.config.gitCommitMessage =
      generatorPlugin.getGitMessage() || context.config.gitCommitMessage;
    ans = await appApi.getInputBySchema(
      schema,
      'formily',
      { ...context.config, ...inputValue },
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
      {},
    );
  } else {
    ans = await appApi.getInputBySchemaFunc(
      getDocSchema,
      { ...context.config, isDoc: true },
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
              isDoc: true,
            },
          ),
      },
    );
  }

  const modernVersion = await getModernVersion(
    Solution.Doc,
    context.config.registry,
    context.config.distTag,
  );

  generator.logger.debug(`inputData=${JSON.stringify(ans)}`, ans);

  const { packageName, packagePath, packageManager } = ans;

  const projectPath = getDocProjectPath(
    packagePath as string,
    isMonorepoSubProject,
  );

  const dirname = path.basename(generator.outputPath);

  await appApi.runSubGenerator(
    getGeneratorPath(BaseGenerator, context.config.distTag),
    undefined,
    { ...context.config, hasPlugin: false },
  );

  await appApi.forgeTemplate(
    'templates/**/*',
    undefined,
    resourceKey =>
      resourceKey.replace('templates/', projectPath).replace('.handlebars', ''),
    {
      name: packageName || dirname,
      isMonorepoSubProject,
      modernVersion,
      packageManager,
    },
  );

  if (isMonorepoSubProject) {
    await appApi.updateWorkspace({
      name: packagePath as string,
      path: projectPath,
    });
  }

  const { packagesInfo } = context.config;
  if (packagesInfo && Object.keys(packagesInfo).length > 0) {
    await appApi.runSubGenerator(
      getGeneratorPath(PackagesGenerator, context.config.distTag),
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

  generator.logger.debug(`start run @modern-js/doc-generator`);
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
      Solution.Doc,
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

  generator.logger.debug(`forge @modern-js/doc-generator succeed `);
};
