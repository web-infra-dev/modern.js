import path from 'path';
import {
  fs,
  getModernPluginVersion,
  isTsProject,
  readTsConfigByFile,
} from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { i18n, Language, Solution } from '@modern-js/generator-common';

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
      generator.logger.warn("'server' is already exist");
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  const getServerPluginVersion = (packageName: string) => {
    return getModernPluginVersion(Solution.MWA, packageName, {
      registry: context.config.registry,
      distTag: context.config.distTag,
      cwd: context.materials.default.basePath,
    });
  };

  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: {
          'dependencies.@modern-js/plugin-server': `${await getServerPluginVersion(
            '@modern-js/plugin-server',
          )}`,
        },
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
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/server-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runInstall(undefined, { ignoreScripts: true });

  appApi.showSuccessInfo();

  generator.logger.debug(`forge @modern-js/server-generator succeed `);
};
