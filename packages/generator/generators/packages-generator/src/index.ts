import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { PackageManager } from '@modern-js/generator-common';
import { fs } from '@modern-js/generator-utils';

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const { packageManager, packagesInfo } = context.config;
  const jsonAPI = new JsonAPI(generator);
  if (packageManager === PackageManager.Pnpm) {
    const update: Record<string, string> = {};
    Object.entries(packagesInfo || {}).forEach(([name, version]) => {
      update[`pnpm.overrides.${name}`] = version as string;
    });
    await jsonAPI.update(context.materials.default.get('package.json'), {
      query: {},
      update: {
        $set: update,
      },
    });
  } else {
    const pkgInfo = fs.readJSONSync(
      path.join(context.materials.default.basePath, 'package.json'),
      'utf-8',
    );
    const { dependencies = {}, devDependencies = {} } = pkgInfo;

    const update: Record<string, string> = {};
    Object.entries(packagesInfo || {}).forEach(([name, version]) => {
      update[`resolutions.${name}`] = version as string;
      if (dependencies[name]) {
        update[`dependencies.${name}`] = version as string;
      }
      if (devDependencies[name]) {
        update[`devDependencies.${name}`] = version as string;
      }
    });
    await jsonAPI.update(context.materials.default.get('package.json'), {
      query: {},
      update: {
        $set: update,
      },
    });
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  const { locale } = context.config;
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/packages-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator);

  generator.logger.debug(`forge @modern-js/packages-generator succeed `);
};
