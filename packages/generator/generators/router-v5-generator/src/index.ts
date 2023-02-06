import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { fs, chalk, getModernConfigFile } from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
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

const ReactRouter6Type = `/// <reference types='@modern-js/runtime/types/router' />`;

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { sourceTypeFile, projectPath } = context.config;

  const appDir = context.materials.default.basePath;
  const isTs = fs.existsSync(
    path.join(appDir, projectPath || '', 'tsconfig.json'),
  );
  if (isTs) {
    const typePath = path.join(
      appDir,
      projectPath || '',
      'src',
      sourceTypeFile || 'modern-app-env.d.ts',
    );
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      if (npmrc.includes(ReactRouter6Type)) {
        fs.writeFileSync(
          typePath,
          npmrc.replace(ReactRouter6Type, ''),
          'utf-8',
        );
      }
    }
  }

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      isSubGenerator: true,
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });
  i18n.changeLanguage(locale);

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/router-v5-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  if (!context.config.isSubGenerator) {
    await appApi.runInstall(undefined, { ignoreScripts: true });
    if (!context.config.pluginName) {
      appApi.showSuccessInfo();
    } else {
      const appDir = context.materials.default.basePath;
      const configFile = await getModernConfigFile(appDir);
      const isTS = configFile.endsWith('ts');
      const { pluginName, pluginDependence } = context.config;
      console.info(
        chalk.green(`\n[INFO]`),
        `${i18n.t(localeKeys.success)}`,
        chalk.yellow.bold(`${configFile}`),
        ':',
        '\n',
      );
      console.info(
        chalk.yellow.bold(`import ${pluginName} from '${pluginDependence}';`),
      );
      if (isTS) {
        console.info(`
export default defineConfig({
  ...,
  runtime: {
    ...,
    router: {
      ${chalk.yellow.bold(`mode: 'react-router-5'`)},
    },
  },
  plugins: [..., ${chalk.yellow.bold(`${pluginName}()`)}],
});
`);
      } else {
        console.info(`
module.exports = {
  ...,
  runtime: {
    ...,
    router: {
      ${chalk.yellow.bold(`mode: 'react-router-5'`)},
    },
  },
  plugins: [..., ${chalk.yellow.bold(`${pluginName}()`)}],
};
`);
      }
      console.info(
        `${i18n.t(localeKeys.successTooltip)} ${chalk.yellow.bold(
          `@modern-js/runtime/router-v5`,
        )} ${i18n.t(localeKeys.successTooltipSuffix)}`,
      );
    }
  }
  generator.logger.debug(`forge @modern-js/router-v5-generator succeed `);
};
