import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  DependenceGenerator,
  Language,
  Solution,
  i18n,
} from '@modern-js/generator-common';
import {
  fs,
  getGeneratorPath,
  getModernPluginVersion,
  isTsProject,
  readTsConfigByFile,
  semver,
} from '@modern-js/generator-utils';

function isEmptyServerDir(serverDir: string) {
  const files = fs.readdirSync(serverDir);
  if (files.length === 0) {
    return true;
  }
  return files.every(file => {
    if (fs.statSync(path.join(serverDir, file)).isDirectory()) {
      const childFiles = fs.readdirSync(path.join(serverDir, file));
      return childFiles.length === 0;
    }
    return false;
  });
}

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);

  const appDir = context.materials.default.basePath;
  const serverDir = path.join(appDir, 'server');

  if (fs.existsSync(serverDir) && !isEmptyServerDir(serverDir)) {
    const files = fs.readdirSync('server');
    if (files.length > 0) {
      generator.logger.warn(`🟡 The 'server' directory already exists.`);
      throw Error("The 'server' directory is already exist");
    }
  }

  const language = isTsProject(appDir) ? Language.TS : Language.JS;
  const serverPlugin = '@modern-js/server-runtime';
  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag, [__dirname]),
    undefined,
    {
      ...context.config,
      devDependencies: {
        ...(context.config.devDependencies || {}),
        [serverPlugin]: await getModernPluginVersion(
          Solution.MWA,
          serverPlugin,
          {
            registry: context.config.registry,
            distTag: context.config.distTag,
            cwd: context.materials.default.basePath,
          },
        ),
        'ts-node': '~10.8.1',
        'tsconfig-paths': '~3.14.1',
      },
    },
  );

  await appApi.forgeTemplate(
    `templates/base-template/${language}/**/*`,
    undefined,
    resourceKey =>
      resourceKey
        .replace(`templates/base-template/${language}/`, '')
        .replace('.handlebars', ''),
  );

  if (language === Language.TS) {
    const tsconfigJSON = readTsConfigByFile(path.join(appDir, 'tsconfig.json'));

    if (!(tsconfigJSON.include || []).includes('server')) {
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'tsconfig.json')),
        {
          query: {},
          update: {
            $set: {
              include: [...(tsconfigJSON.include || []), 'server'],
            },
          },
        },
        true,
      );
    }
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  const modernVersion = await getModernPluginVersion(
    Solution.MWA,
    '@modern-js/app-tools',
    { registry: context.config.registry, distTag: context.config.distTag },
  );

  if (semver.lt(modernVersion, '2.67.5')) {
    generator.logger.warn(
      `🟡 The current Modern.js version ${modernVersion} does not support Custom Web Server. Please upgrade to at least version 2.67.5.`,
    );
    throw Error(
      'The current Modern.js version does not support Custom Web Server. Please upgrade to at least version 1.67.5',
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run Server Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`🌟 [End Run Server Generator]`);
};
