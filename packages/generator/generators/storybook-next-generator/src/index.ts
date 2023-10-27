import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  isTsProject,
  getPackageManager,
  fs,
  isReact18,
  getPackageVersion,
  getPackageManagerText,
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
    `templates/storybook-${language}/**/*`,
    undefined,
    resourceKey => {
      const key = resourceKey
        .replace(`templates/storybook-${language}/`, '.storybook/')
        .replace('.handlebars', `.${language}`);
      return key;
    },
  );

  await appApi.forgeTemplate('templates/stories/**/*', undefined, resourceKey =>
    resourceKey
      .replace('templates/', '')
      .replace('.handlebars', `.${language}x`),
  );

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

  const exitAddonsVersion =
    pkg.devDependencies?.[ADDON_ESSENTIAL] ||
    pkg.dependencies?.[ADDON_ESSENTIAL];

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
  };

  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, './package.json')),
    {
      query: {},
      update: {
        $set: {
          scripts: {
            'build-storybook': 'storybook build',
            storybook: 'storybook dev -p 6006',
            ...(pkg.scripts || {}),
          },
        },
      },
    },
  );

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

  generator.logger.debug(`start run @modern-js/storybook-next-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  const { packageManager } = await handleTemplateFile(
    context,
    appApi,
    generator,
  );

  appApi.showSuccessInfo(
    i18n.t(localeKeys.success, {
      packageManager: getPackageManagerText(packageManager),
    }),
  );

  generator.logger.debug(`forge @modern-js/storybook-next-generator succeed `);
};
