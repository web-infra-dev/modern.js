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
  getPackageVersion,
} from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
  Language,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';
import { getMajorVersion } from './utils';

const ADDON_ESSENTIAL = '@storybook/addon-essentials';

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
  generator: GeneratorCore,
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

  const exitAddonsVersion = pkg.devDependencies?.[ADDON_ESSENTIAL];
  const isExitStorybook = pkg.devDependencies?.['@modern-js/storybook'];

  const latestVersion = await getPackageVersion(ADDON_ESSENTIAL);
  let availableVersion = latestVersion;

  try {
    if (exitAddonsVersion) {
      const majorVersion = getMajorVersion(exitAddonsVersion);
      generator.logger.info(
        `Detected installed ${ADDON_ESSENTIAL}, version ${exitAddonsVersion}`,
      );

      // User specify addons with major version 7, so using users
      if (majorVersion === 7) {
        availableVersion = exitAddonsVersion;
      }
    } else {
      const majorVersion = getMajorVersion(latestVersion);
      if (majorVersion > 7) {
        availableVersion = '^7';
      }
    }
  } catch (_) {}

  const addStorybookDependence = {
    [ADDON_ESSENTIAL]: availableVersion,
    ...(!isExitStorybook
      ? {
          '@modern-js/storybook': modernVersion,
        }
      : {}),
  };

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
