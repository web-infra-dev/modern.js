import path from 'path';
import {
  fs,
  chalk,
  getPackageVersion,
  getModernPluginVersion,
  isTsProject,
  readTsConfigByFile,
  getModernConfigFile,
} from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  getBFFSchema,
  BFFType,
  i18n as commonI18n,
  Framework,
  Language,
  FrameworkAppendTypeContent,
  Solution,
  BFFPluginName,
  BFFPluginDependence,
} from '@modern-js/generator-common';
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

  const ans = await appApi.getInputBySchemaFunc(getBFFSchema, context.config);

  const appDir = context.materials.default.basePath;
  const apiDir = path.join(appDir, 'api');

  if (fs.existsSync(apiDir) && !isEmptyApiDir(apiDir)) {
    const files = fs.readdirSync(apiDir);
    if (files.length > 0) {
      generator.logger.warn("'api' is already exist");
      throw Error("'api' is already exist");
    }
  }

  const { bffType, framework } = ans;

  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  const getBffPluginVersion = (packageName: string) => {
    return getModernPluginVersion(Solution.MWA, packageName, {
      registry: context.config.registry,
      distTag: context.config.distTag,
      cwd: context.materials.default.basePath,
    });
  };

  // update bff plugin config
  context.config.bffPluginName = BFFPluginName[framework as Framework];
  context.config.bffPluginDependence =
    BFFPluginDependence[framework as Framework];

  let updateInfo: Record<string, string> = {};

  if (framework === Framework.Express || framework === Framework.Koa) {
    updateInfo = {
      [`devDependencies.@types/${
        framework as string
      }`]: `~${await getPackageVersion(`@types/${framework as string}`)}`,
    };
  }

  updateInfo = {
    ...updateInfo,
    [`dependencies.${framework as string}`]: `~${await getPackageVersion(
      framework as string,
    )}`,
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
          [`dependencies.@modern-js/plugin-${
            framework as string
          }`]: `${await getBffPluginVersion(
            `@modern-js/plugin-${framework as string}`,
          )}`,
          'devDependencies.ts-node': '~10.8.1',
          'devDependencies.tsconfig-paths': '~3.14.1',
          ...updateInfo,
        },
      },
    },
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
      );
    }
  }

  if (bffType === BFFType.Func) {
    if (language === Language.TS) {
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'tsconfig.json')),
        {
          query: {},
          update: {
            $set: {
              'compilerOptions.paths.@api/*': ['./api/*'],
            },
          },
        },
      );
    }
    await appApi.forgeTemplate(
      'templates/function/base/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/function/base/', 'api/')
          .replace('.handlebars', `.${language}`),
    );
    await appApi.forgeTemplate(
      `templates/function/info/*`,
      resourceKey => resourceKey.includes(language),
      resourceKey =>
        resourceKey
          .replace('templates/function/info/', 'api/info/')
          .replace('.handlebars', ``),
    );
    await appApi.forgeTemplate(
      `templates/function/app/${language}/${
        framework as string
      }.${language}.handlebars`,
      undefined,
      resourceKey =>
        resourceKey.replace(
          `templates/function/app/${language}/${
            framework as string
          }.${language}.handlebars`,
          `api/_app.${language}`,
        ),
    );
  } else {
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
      );
    }
    await appApi.forgeTemplate(
      `templates/framework/lambda/*`,
      undefined,
      resourceKey =>
        resourceKey
          .replace(`templates/framework/`, 'api/')
          .replace('.handlebars', `.${language}`),
    );
    await appApi.forgeTemplate(
      `templates/framework/app/${framework as string}/**/*`,
      resourceKey =>
        framework === Framework.Koa ? resourceKey.includes(language) : true,
      resourceKey =>
        resourceKey
          .replace(`templates/framework/app/${framework as string}/`, 'api/')
          .replace(
            '.handlebars',
            framework === Framework.Express ? `.${language}` : '',
          ),
    );
  }

  const appendTypeContent = FrameworkAppendTypeContent[framework as Framework];

  if (appendTypeContent && language === Language.TS) {
    const typePath = path.join(appDir, 'src', 'modern-app-env.d.ts');
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      if (!npmrc.includes(appendTypeContent)) {
        fs.writeFileSync(typePath, `${npmrc}${appendTypeContent}\n`, 'utf-8');
      }
    } else {
      fs.ensureFileSync(typePath);
      fs.writeFileSync(typePath, appendTypeContent, 'utf-8');
    }
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/bff-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  try {
    await handleTemplateFile(context, generator, appApi);
  } catch (e) {
    // eslint-disable-next-line no-process-exit
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
      const {
        pluginName,
        bffPluginName,
        pluginDependence,
        bffPluginDependence,
      } = context.config;
      console.info(
        chalk.green(`\n[INFO]`),
        `${i18n.t(isTS ? localeKeys.successTs : localeKeys.successJS)}`,
        chalk.yellow.bold(`${configFile}`),
        ':',
        '\n',
      );
      console.info(
        chalk.yellow.bold(`import ${pluginName} from '${pluginDependence}';`),
      );
      console.info(
        chalk.yellow.bold(
          `import ${bffPluginName} from '${bffPluginDependence}';`,
        ),
      );
      if (isTS) {
        console.info(`
export default defineConfig({
  ...,
  plugins: [..., ${chalk.yellow.bold(`${pluginName}(), ${bffPluginName}()`)}],
});
`);
      } else {
        console.info(`
module.exports = {
  ...,
  plugins: [..., ${chalk.yellow.bold(`${pluginName}(), ${bffPluginName}()`)}],
};
`);
      }
    }
  }

  generator.logger.debug(`forge @modern-js/bff-generator succeed `);
};
