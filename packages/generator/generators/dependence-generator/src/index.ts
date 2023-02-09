import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { i18n as commonI18n } from '@modern-js/generator-common';
import { fs, chalk, getModernConfigFile } from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const jsonAPI = new JsonAPI(generator);
  const {
    devDependencies,
    dependencies,
    peerDependencies,
    appendTypeContent,
    sourceTypeFile,
    projectPath,
  } = context.config;

  const setJSON: Record<string, Record<string, string>> = {};
  Object.keys(devDependencies || {}).forEach(key => {
    setJSON[`devDependencies.${key}`] = devDependencies[key];
  });
  Object.keys(dependencies || {}).forEach(key => {
    setJSON[`dependencies.${key}`] = dependencies[key];
  });
  Object.keys(peerDependencies || {}).forEach(key => {
    setJSON[`peerDependencies.${key}`] = peerDependencies[key];
  });
  if (Object.keys(setJSON).length > 0) {
    await jsonAPI.update(
      context.materials.default.get(
        path.join(projectPath || '', 'package.json'),
      ),
      {
        query: {},
        update: { $set: setJSON },
      },
    );
  }

  const appDir = context.materials.default.basePath;
  const isTs = fs.existsSync(
    path.join(appDir, projectPath || '', 'tsconfig.json'),
  );
  if (appendTypeContent && isTs) {
    const typePath = path.join(
      appDir,
      projectPath || '',
      'src',
      sourceTypeFile || 'modern-app-env.d.ts',
    );
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      if (!npmrc.includes(appendTypeContent)) {
        fs.writeFileSync(typePath, `${appendTypeContent}\n${npmrc}`, 'utf-8');
      }
    } else {
      fs.ensureFileSync(typePath);
      fs.writeFileSync(typePath, appendTypeContent, 'utf-8');
    }
  }
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  // when use new command, listeners will create more than 10
  process.setMaxListeners(20);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/dependence-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator);

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

  generator.logger.debug(`forge @modern-js/dependence-generator succeed `);
};
