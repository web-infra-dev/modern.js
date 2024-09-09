import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  Solution,
  SolutionGenerator,
  i18n as commonI18n,
  getGeneratorSchema,
} from '@modern-js/generator-common';
import {
  fs,
  getAllPackages,
  getGeneratorPath,
  getModuleProjectPath,
  i18n as utilsI18n,
  validatePackageName,
  validatePackagePath,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { outputPath } = generator;

  let packages: string[] = [];

  const {
    isMonorepoSubProject,
    isLocalPackages,
    projectDir = '',
  } = context.config;

  if (isMonorepoSubProject && !isLocalPackages) {
    try {
      packages = getAllPackages(outputPath);
    } catch (e) {
      generator.logger.debug('get all packages error', e);
      generator.logger.warn(i18n.t(localeKeys.lerna_error));
    }
  }

  const { packageName, packagePath, language, packageManager } =
    await appApi.getInputBySchemaFunc(
      getGeneratorSchema,
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

  await appApi.runSubGenerator(
    getGeneratorPath(
      SolutionGenerator[Solution.Module],
      context.config.distTag,
    ),
    undefined,
    {
      ...context.config,
      isSubGenerator: true,
    },
  );

  const moduleProjectPath = getModuleProjectPath(
    packagePath as string,
    isMonorepoSubProject,
    isLocalPackages,
  );

  const projectPath = projectDir
    ? path.join(projectDir, moduleProjectPath)
    : moduleProjectPath;

  await appApi.forgeTemplate(
    `templates/${language as string}-template/**/*`,
    undefined,
    (resourceKey: string) =>
      resourceKey
        .replace(`templates/${language as string}-template/`, projectPath)
        .replace('.handlebars', ''),
    { packageName },
  );

  const updateInfo = {
    files: ['/templates', '/dist/index.js'],
    main: './dist/index.js',
    types: undefined,
    module: undefined,
    'jsnext:modern': undefined,
    exports: undefined,
    'scripts.prepare': `${packageManager as string} build`,
    'devDependencies.@modern-js/codesmith-api-app': '^2.0.0',
    'devDependencies.@modern-js/codesmith': '^2.0.0',
    'peerDependencies.react': undefined,
  };

  const jsonAPI = new JsonAPI(generator);

  await jsonAPI.update(
    context.materials.default.get(path.join(projectPath, 'package.json')),
    {
      query: {},
      update: { $set: updateInfo },
    },
    true,
  );

  await fs.mkdirp(path.join(projectPath, 'templates'));
  fs.removeSync(path.join(projectPath, '.npmignore'));
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });
  utilsI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/generator-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runGitAndInstall(context.config.gitCommitMessage);

  appApi.showSuccessInfo();

  generator.logger.debug(`forge @modern-js/generator-generator succeed `);
};
