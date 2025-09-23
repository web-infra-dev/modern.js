import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { DependenceGenerator, i18n } from '@modern-js/generator-common';
import {
  getGeneratorPath,
  readTsConfigByFile,
} from '@modern-js/generator-utils';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const appDir = context.materials.default.basePath;
  const jsonAPI = new JsonAPI(generator);

  await appApi.forgeTemplate(
    'templates/ts-template/**/*',
    undefined,
    resourceKey => resourceKey.replace('templates/ts-template/', ''),
  );

  const tsconfigJSON = readTsConfigByFile(path.join(appDir, 'tsconfig.json'));

  if (!(tsconfigJSON.include || []).includes('tailwind.config.ts')) {
    await jsonAPI.update(
      context.materials.default.get(path.join(appDir, 'tsconfig.json')),
      {
        query: {},
        update: {
          $set: {
            include: [...(tsconfigJSON.include || []), 'tailwind.config.ts'],
          },
        },
      },
      true,
    );
  }

  const { dependencies, peerDependencies, devDependencies } = context.config;
  const tailwindVersion = '~3.4.14';
  if (dependencies?.tailwindcss) {
    dependencies.tailwindcss = tailwindVersion;
  }
  if (peerDependencies?.tailwindcss) {
    peerDependencies.tailwindcss = tailwindVersion;
  }
  if (devDependencies?.tailwindcss) {
    devDependencies.tailwindcss = tailwindVersion;
  }
  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag, [__dirname]),
    undefined,
    {
      ...context.config,
      dependencies,
      devDependencies,
      peerDependencies,
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Tailwindcss Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`🌟 [End Run Tailwindcss Generator]`);
};
