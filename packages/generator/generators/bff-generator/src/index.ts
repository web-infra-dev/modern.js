import path from 'path';
import {
  fs,
  getPackageVersion,
  isTsProject,
  readTsConfigByFile,
} from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  BFFSchema,
  BFFType,
  i18n,
  Framework,
  Language,
  FrameworkAppendTypeContent,
} from '@modern-js/generator-common';

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

  const ans = await appApi.getInputBySchema(BFFSchema, context.config);

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

  if (language === Language.JS && framework === Framework.Nest) {
    generator.logger.warn('nest not support js project');
    throw Error('nest not support js project');
  }

  let updateInfo: Record<string, string> = {};

  if (framework === Framework.Express || framework === Framework.Koa) {
    updateInfo = {
      [`devDependencies.@types/${
        framework as string
      }`]: `^${await getPackageVersion(`@types/${framework as string}`)}`,
    };
  }

  if (framework === Framework.Nest) {
    updateInfo = {
      'dependencies.@nestjs/core': `^${await getPackageVersion(
        '@nestjs/core',
      )}`,
      'dependencies.@nestjs/common': `^${await getPackageVersion(
        '@nestjs/common',
      )}`,
    };
    if (bffType === BFFType.Func) {
      updateInfo['dependencies.express'] = `^${await getPackageVersion(
        'express',
      )}`;
      updateInfo[
        'devDependencies.@types/express'
      ] = `^${await getPackageVersion('@types/express')}`;
    }
  } else {
    updateInfo = {
      ...updateInfo,
      [`dependencies.${framework as string}`]: `^${await getPackageVersion(
        framework as string,
      )}`,
    };
  }

  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: {
          'dependencies.@modern-js/plugin-bff': `^${await getPackageVersion(
            '@modern-js/plugin-bff',
          )}`,
          [`dependencies.@modern-js/plugin-${
            framework as string
          }`]: `^${await getPackageVersion(
            `@modern-js/plugin-${framework as string}`,
          )}`,
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
        framework === Framework.Egg || framework === Framework.Koa
          ? resourceKey.includes(language)
          : true,
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

  await appApi.runInstall();

  generator.logger.debug(`forge @modern-js/bff-generator succeed `);
};
