import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
// import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  isTsProject,
  getPackageManager,
  getPackageManagerText,
  fs,
  isReact18,
} from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
  Language,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
  _generator: GeneratorCore,
) => {
  const appDir = context.materials.default.basePath;
  const language = isTsProject(appDir) ? Language.TS : Language.JS;
  await appApi.forgeTemplate(
    '../templates/stories/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/', '')
        .replace('.handlebars', `.${language}x`),
  );

  await appApi.forgeTemplate(
    `../templates/storybook-${language}/**/*`,
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/', '')
        .replace(`storybook-${language}`, '.storybook')
        .replace('.handlebars', `.${language}`),
  );

  if (language === Language.TS) {
    await appApi.forgeTemplate(
      '../templates/ts-template/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/ts-template/', `stories/`)
          .replace('.handlebars', ``),
    );
  } else {
    appApi.forgeTemplate(
      '../templates/js-template/**/*',
      undefined,
      resourceKey =>
        resourceKey
          .replace('templates/js-template/', `stories/`)
          .replace('.handlebars', ``),
    );
  }

  // adjust react-dom dependence
  const pkg = await fs.readJSON(
    path.join(context.materials.default.basePath, 'package.json'),
  );
  const isExitReactDom =
    pkg.devDependencies?.['react-dom'] || pkg.dependencies?.['react-dom'];
  const addReactDomDependence = isExitReactDom
    ? {}
    : {
        'react-dom': isReact18(context.materials.default.basePath)
          ? '^18'
          : '^17',
      };

  const isExitReact = pkg.devDependencies?.react || pkg.dependencies?.react;
  const addReactDependence = isExitReact
    ? {}
    : {
        react: isReact18(context.materials.default.basePath) ? '^18' : '^17',
      };

  const { modernVersion } = context.config;

  const isExitAddons = pkg.devDependencies?.['@storybook/addon-essentials'];
  const isExitStorybook = pkg.devDependencies?.['@modern-js/storybook'];

  const addStorybookDependence = {
    ...(!isExitAddons
      ? {
          '@storybook/addon-essentials': 'latest',
        }
      : {}),
    ...(!isExitStorybook
      ? {
          '@modern-js/storybook': modernVersion,
        }
      : {}),
  };

  // // modify stories/tsconfig.json
  // if (language === Language.TS) {
  //   const jsonAPI = new JsonAPI(generator);
  //   await jsonAPI.update(
  //     context.materials.default.get(
  //       path.join(appDir, './stories/tsconfig.json'),
  //     ),
  //     {
  //       query: {},
  //       update: {
  //         $set: {
  //           'compilerOptions.paths': {
  //             [`${pkg.name}`]: ['.'],
  //             [`${pkg.name}/*`]: ['./*'],
  //           },
  //         },
  //       },
  //     },
  //   );
  // }

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      devDependencies: {
        ...(context.config.devDependencies || {}),
        ...addReactDomDependence,
        ...addReactDependence,
        ...addStorybookDependence,
      },
    },
  );

  const packageManager =
    context.config.packageManager || (await getPackageManager(appDir));

  return { packageManager };
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/storybook-generator-next`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  const { packageManager } = await handleTemplateFile(
    context,
    appApi,
    generator,
  );

  if (context.config.isSubGenerator) {
    appApi.showSuccessInfo(
      i18n.t(localeKeys.success, {
        packageManager: getPackageManagerText(packageManager),
      }),
    );
  }

  generator.logger.debug(`forge @modern-js/storybook-generator-next succeed `);
};
