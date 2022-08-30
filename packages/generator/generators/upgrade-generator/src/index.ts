import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  getModernVersion,
  getPackageManager,
  getPackageObj,
} from '@modern-js/generator-utils';
import { Solution, SolutionToolsMap } from '@modern-js/generator-common';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const jsonAPI = new JsonAPI(generator);
  // get project solution type
  const pkgInfo = await getPackageObj(context);
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };
  const solutionDeps = Object.keys(SolutionToolsMap).filter(
    solution => deps[SolutionToolsMap[solution as Solution]],
  );
  if (solutionDeps.length === 0) {
    throw Error('You should install Modern.js solution tools first');
  }
  if (solutionDeps.length >= 2) {
    throw Error('The project not allow containers more solution tools');
  }

  // get modern latest version
  const modernVersion = await getModernVersion(
    solutionDeps[0] as Solution,
    context.config.registry,
  );

  const appDir = context.materials.default.basePath;

  context.config.packageManager = await getPackageManager(appDir);

  const modernDeps = Object.keys(pkgInfo.dependencies).filter(
    dep => dep.startsWith('@modern-js') || dep.startsWith('@modern-js-app'),
  );
  const modernDevDeps = Object.keys(pkgInfo.devDependencies).filter(
    dep => dep.startsWith('@modern-js') || dep.startsWith('@modern-js-app'),
  );
  const updateInfo: Record<string, string> = {};

  modernDeps.forEach(dep => {
    updateInfo[`dependencies.${dep}`] = modernVersion;
  });

  modernDevDeps.forEach(dep => {
    updateInfo[`devDependencies.${dep}`] = modernVersion;
  });
  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: updateInfo,
      },
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  generator.logger.debug(`start run @modern-js/upgrade-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator);

  await appApi.runInstall();

  appApi.showSuccessInfo();

  generator.logger.debug(`forge @modern-js/upgrade-generator succeed `);
};
