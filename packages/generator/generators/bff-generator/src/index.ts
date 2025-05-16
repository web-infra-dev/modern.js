import path from 'path';
import type { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  Language,
  Solution,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import {
  fs,
  chalk,
  getModernConfigFile,
  getModernPluginVersion,
  isTsProject,
  readTsConfigByFile,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

function isEmptyApiDir(apiDir: string) {
  const files = fs.readdirSync(apiDir);
  if (files.length === 0) {
    return true;
  }
  return files.every(file => {
    if (fs.statSync(path.join(apiDir, file)).isDirectory()) {
      const childFiles = fs.readdirSync(path.join(apiDir, file));
      return childFiles.length === 0;
    }
    return false;
  });
}

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);

  const appDir = context.materials.default.basePath;
  const apiDir = path.join(appDir, 'api');

  if (fs.existsSync(apiDir) && !isEmptyApiDir(apiDir)) {
    const files = fs.readdirSync(apiDir);
    if (files.length > 0) {
      generator.logger.warn(`🟡 The 'api' directory already exists.`);
      throw Error("The 'api' directory is already exist");
    }
  }

  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  const getBffPluginVersion = (packageName: string) => {
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
          'dependencies.@modern-js/plugin-bff': `${await getBffPluginVersion(
            '@modern-js/plugin-bff',
          )}`,
          'devDependencies.ts-node': '~10.8.1',
          'devDependencies.tsconfig-paths': '~3.14.1',
        },
      },
    },
    true,
  );

  if (language === Language.TS) {
    const tsconfigJSON = readTsConfigByFile(path.join(appDir, 'tsconfig.json'));

    if (!(tsconfigJSON.include || []).includes('api')) {
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'tsconfig.json')),
        {
          query: {},
          update: {
            $set: {
              include: [...(tsconfigJSON.include || []), 'api'],
            },
          },
        },
        true,
      );
    }
  }

  if (language === Language.TS) {
    await jsonAPI.update(
      context.materials.default.get(path.join(appDir, 'tsconfig.json')),
      {
        query: {},
        update: {
          $set: {
            'compilerOptions.paths.@api/*': ['./api/lambda/*'],
          },
        },
      },
      true,
    );

    await appApi.forgeTemplate(
      `templates/framework/lambda/*`,
      undefined,
      resourceKey =>
        resourceKey
          .replace(`templates/framework/`, 'api/')
          .replace('.handlebars', `.${language}`),
    );
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    process.exit(1);
  }

  generator.logger.debug(`🚀 [Start Run BFF Generator]`);
  generator.logger.debug(
    '💡 [Current Config]:',
    JSON.stringify(context.config),
  );

  try {
    await handleTemplateFile(context, generator, appApi);
  } catch (e) {
    process.exit(1);
  }

  await appApi.runInstall(undefined, { ignoreScripts: true });

  if (!context.config.isSubGenerator) {
    await appApi.runInstall(undefined, { ignoreScripts: true });
    if (!context.config.pluginName) {
      appApi.showSuccessInfo();
    } else {
      const appDir = context.materials.default.basePath;
      const configFile = await getModernConfigFile(appDir);
      const isTS = configFile.endsWith('ts');
      const { pluginName, pluginDependence, shouldUsePluginNameExport } =
        context.config;

      console.info(
        chalk.green(`\n[INFO]`),
        `${i18n.t(localeKeys.success)}`,
        chalk.yellow.bold(`${configFile}`),
        ':',
        '\n',
      );
      if (shouldUsePluginNameExport) {
        console.info(
          chalk.yellow.bold(
            `import { ${pluginName} } from '${pluginDependence}';`,
          ),
        );
      } else {
        console.info(
          chalk.yellow.bold(`import ${pluginName} from '${pluginDependence}';`),
        );
      }

      if (isTS) {
        console.info(`
export default defineConfig({
  ...,
  plugins: [..., ${chalk.yellow.bold(`${pluginName}()`)}],
});
`);
      } else {
        console.info(`
module.exports = {
  ...,
  plugins: [..., ${chalk.yellow.bold(`${pluginName}()`)}],
};
`);
      }
    }
  }

  generator.logger.debug(`🌟 [End Run BFF Generator]`);
};
