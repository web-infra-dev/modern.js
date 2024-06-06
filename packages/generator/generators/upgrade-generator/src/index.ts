import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  ora,
  getAvailableVersion,
  getModernVersion,
  getPackageManager,
  getPackageObj,
  semver,
  fs,
  isPackageExist,
  getPackageVersion,
} from '@modern-js/generator-utils';
import {
  PackageManager,
  Solution,
  SolutionText,
  SolutionToolsMap,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

// Special modern.js dependencies, the plugin version maybe not same with other modern.js plugin
const SpecialModernDeps = [
  '@modern-js/plugin-storybook',
  '@modern-js/builder-rspack-provider', // need be removed after 2.46.1
];

const DeprecatedModernBuilderDeps = [
  '@modern-js/builder-plugin-image-compress',
  '@modern-js/builder-plugin-swc',
  '@modern-js/builder-plugin-esbuild',
  '@modern-js/builder-plugin-node-polyfill',
  '@modern-js/builder-plugin-stylus',
];

const handleSpecialModernDeps = async (dep: string, modernVersion: string) => {
  const version = await getAvailableVersion(dep, modernVersion);
  if (!(await isPackageExist(`${dep}@${version}`))) {
    return getPackageVersion(dep);
  }
  return version;
};

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);
  // get project solution type
  const pkgInfo = await getPackageObj(context);
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };
  const solutions = Object.keys(SolutionToolsMap).filter(
    solution => deps[SolutionToolsMap[solution as Solution]],
  );
  if (solutions.length === 0) {
    throw Error(i18n.t(localeKeys.tooltip.no_solution));
  }
  if (solutions.length >= 2) {
    throw Error(i18n.t(localeKeys.tooltip.more_solution));
  }

  generator.logger.info(
    `[${i18n.t(localeKeys.projectType)}]: ${SolutionText[
      solutions[0] as Solution
    ]()}`,
  );

  // get modern latest version
  const modernVersion = await getModernVersion(
    solutions[0] as Solution,
    context.config.registry,
    context.config.distTag,
  );

  generator.logger.info(
    `[${i18n.t(localeKeys.modernVersion)}]: ${modernVersion}`,
  );

  // adjust Modern.js packages' version is latest?
  if (
    Object.keys(deps)
      .filter(
        dep => dep.startsWith('@modern-js') || dep.startsWith('@modern-js-app'),
      )
      .filter(dep => !dep.includes('electron'))
      .filter(dep => !dep.includes('codesmith') && !dep.includes('easy-form'))
      .filter(dep => !dep.startsWith('@modern-js-reduck'))
      .every(dep => deps[dep] === modernVersion)
  ) {
    generator.logger.info(
      `[${i18n.t(localeKeys.alreadyLatest)}]: ${modernVersion}`,
    );
    return;
  }

  const appDir = context.materials.default.basePath;

  const packageManager = await getPackageManager(appDir);
  context.config.packageManager = packageManager;

  if (packageManager === PackageManager.Pnpm) {
    const npmrcPath = path.join(generator.outputPath, '.npmrc');
    if (fs.existsSync(npmrcPath)) {
      const content = fs.readFileSync(npmrcPath, 'utf-8');
      if (!content.includes('strict-peer-dependencies=false')) {
        fs.appendFileSync(npmrcPath, '\nstrict-peer-dependencies=false\n');
      }
    } else {
      fs.ensureFileSync(npmrcPath);
      fs.writeFileSync(npmrcPath, 'strict-peer-dependencies=false');
    }
  }

  const modernDeps = Object.keys(pkgInfo.dependencies || {}).filter(
    dep => dep.startsWith('@modern-js') || dep.startsWith('@modern-js-app'),
  );
  const modernDevDeps = Object.keys(pkgInfo.devDependencies || {}).filter(
    dep => dep.startsWith('@modern-js') || dep.startsWith('@modern-js-app'),
  );
  const updateInfo: Record<string, string> = {};

  const spinner = ora({
    text: 'Load Generator...',
    spinner: 'runner',
  }).start();

  await Promise.all(
    modernDeps.map(async dep => {
      if (SpecialModernDeps.includes(dep)) {
        updateInfo[`dependencies.${dep}`] = await handleSpecialModernDeps(
          dep,
          modernVersion,
        );
      } else if (DeprecatedModernBuilderDeps.includes(dep)) {
        generator.logger.warn(
          `[Deprecated] ${dep} is no longer maintained, please use Rsbuild plugin instead`,
        );
      } else {
        updateInfo[`dependencies.${dep}`] = await getAvailableVersion(
          dep,
          modernVersion,
        );
      }
    }),
  );

  await Promise.all(
    modernDevDeps.map(async dep => {
      if (SpecialModernDeps.includes(dep)) {
        updateInfo[`devDependencies.${dep}`] = await handleSpecialModernDeps(
          dep,
          modernVersion,
        );
      } else if (DeprecatedModernBuilderDeps.includes(dep)) {
        generator.logger.warn(
          `[Deprecated] ${dep} is no longer maintained, please use Rsbuild plugin instead`,
        );
      } else {
        updateInfo[`devDependencies.${dep}`] = await getAvailableVersion(
          dep,
          modernVersion,
        );
      }
    }),
  );
  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: updateInfo,
      },
    },
  );

  spinner.stop();

  // update husky
  const huskyVersion = deps.husky;
  try {
    if (huskyVersion && semver.lt(huskyVersion, '8.0.0')) {
      generator.logger.info(`${i18n.t(localeKeys.updateHusky)}`);
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'package.json')),
        {
          query: {},
          update: {
            $set: {
              'devDependencies.husky': '^8.0.0',
            },
          },
        },
      );

      const pkgPath = context.materials.default.get(
        path.join(appDir, 'package.json'),
      ).filePath;
      const pkgInfo = fs.readJSONSync(pkgPath, 'utf-8');
      const { prepare } = pkgInfo.scripts;
      if (!prepare) {
        pkgInfo.scripts.prepare = 'husky install';
      } else if (!prepare.includes('husky install')) {
        pkgInfo.scripts.prepare = `${prepare} && husky install`;
      }
      pkgInfo.husky = undefined;

      fs.writeJSONSync(pkgPath, pkgInfo, { spaces: 2 });

      await appApi.forgeTemplate('templates/**/*');
      fs.chmodSync(
        path.join(generator.outputPath, '.husky', 'pre-commit'),
        '755',
      );
    }
  } catch (e) {}

  await appApi.runInstall();

  appApi.showSuccessInfo(i18n.t(localeKeys.success));
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  generator.logger.debug(`start run @modern-js/upgrade-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`forge @modern-js/upgrade-generator succeed `);
};
