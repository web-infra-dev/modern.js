import path from 'path';
import {
  canUsePnpm,
  canUseYarn,
  GeneratorContext,
  GeneratorCore,
} from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  i18n as commonI18n,
  BaseGenerator,
  Solution,
  MonorepoSchema,
  PackageManager,
  ChangesetGenerator,
} from '@modern-js/generator-common';
import { getPackageManagerText } from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { hasPlugin, generatorPlugin, ...extra } = context.config;

  let schema = MonorepoSchema;
  let inputValue = {};

  if (hasPlugin) {
    await generatorPlugin.installPlugins(Solution.Monorepo, extra);
    schema = generatorPlugin.getInputSchema(Solution.Monorepo);
    inputValue = generatorPlugin.getInputValue();
    context.config.gitCommitMessage =
      generatorPlugin.getGitMessage() || context.config.gitCommitMessage;
  }

  const ans = await appApi.getInputBySchema(schema, {
    ...context.config,
    ...inputValue,
    isMonorepo: true,
  });

  generator.logger.debug(`ans=`, ans);

  const { packageManager } = ans;
  await appApi.runSubGenerator(
    getGeneratorPath(BaseGenerator, context.config.distTag),
    undefined,
    { ...context.config, hasPlugin: false },
  );

  await appApi.forgeTemplate(
    'templates/base-template/**/*',
    undefined,
    (resourceKey: string) =>
      resourceKey
        .replace('templates/base-template/', '')
        .replace('.handlebars', ''),
    { packageManager },
  );

  if (packageManager === PackageManager.Pnpm) {
    await appApi.forgeTemplate(
      'templates/pnpm-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/pnpm-template/', '')
          .replace('.handlebars', ''),
    );
  }

  if (packageManager === PackageManager.Yarn) {
    await appApi.forgeTemplate(
      'templates/yarn-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/yarn-template/', '')
          .replace('.handlebars', ''),
    );

    const jsonAPI = new JsonAPI(generator);

    await jsonAPI.update(
      context.materials.default.get(
        path.join(generator.outputPath, 'package.json'),
      ),
      {
        query: {},
        update: {
          $set: {
            'scripts.prepare': 'lerna run prepare',
          },
        },
      },
    );
  }

  await appApi.runSubGenerator(
    getGeneratorPath(ChangesetGenerator, context.config.distTag),
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale, successInfo } = context.config;
  commonI18n.changeLanguage({ locale });
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  // monorepo 场景下必须使用 pnpm 或者 yarn
  if (!(await canUsePnpm()) && !(await canUseYarn())) {
    generator.logger.warn(i18n.t(localeKeys.environment.yarn_pnpm));
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/monorepo-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  try {
    await handleTemplateFile(context, generator, appApi);
  } catch (e) {
    generator.logger.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  if (context.handleForged) {
    await context.handleForged(
      Solution.Monorepo,
      context,
      context.config.hasPlugin,
    );
  }

  try {
    await appApi.runGitAndInstall(context.config.gitCommitMessage);
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  appApi.showSuccessInfo(
    successInfo ||
      i18n.t(localeKeys.success, {
        packageManager: getPackageManagerText(context.config.packageManager),
      }),
  );

  generator.logger.debug(`forge @modern-js/monorepo-generator succeed `);
};
