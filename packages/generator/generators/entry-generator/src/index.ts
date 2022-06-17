import path from 'path';
import { isEqual, merge } from '@modern-js/utils/lodash';
import { fs, getPackageObj, isTsProject } from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { renderString } from '@modern-js/codesmith-api-handlebars';
import {
  i18n as commonI18n,
  EntrySchema,
  BooleanConfig,
  ClientRoute,
} from '@modern-js/generator-common';
import { isEmptySource, isSingleEntry } from './utils';
import { i18n, localeKeys } from './locale';

const handleInput = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const appDir = context.materials.default.basePath;

  const { entriesDir } = context.config;

  await fs.ensureDir(path.join(appDir, entriesDir));

  const analysisInfo = {
    isEmptySrc: isEmptySource(appDir, entriesDir),
    isSingleEntry: isSingleEntry(appDir, entriesDir),
    isTsProject: isTsProject(appDir),
  };

  generator.logger.debug('analysisInfo:', analysisInfo);

  const ans = await appApi.getInputBySchema(EntrySchema, {
    ...context.config,
    ...analysisInfo,
  });

  if (ans.needModifyMWAConfig === 'no') {
    ans.disableStateManagement = BooleanConfig.NO;
    ans.clientRoute = ClientRoute.SelfControlRoute;
  }
  return ans;
};

const refactorSingleEntry = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const pkgObj = await getPackageObj(context);
  const pkgName = pkgObj.name;

  const { entriesDir } = context.config;

  const oldFilePath = path.join(context.materials.default.basePath, entriesDir);
  const oldFiles = fs
    .readdirSync(oldFilePath)
    .filter(filePath => {
      if (fs.statSync(path.join(oldFilePath, filePath)).isDirectory()) {
        const files = fs.readdirSync(path.join(oldFilePath, filePath));
        return files.length;
      }
      return (
        filePath !== '.eslintrc.json' &&
        filePath !== '.eslintrc.js' &&
        filePath !== 'modern-app-env.d.ts'
      );
    })
    .map(file =>
      path.join(context.materials.default.basePath, entriesDir, file),
    );

  // create new dir in entriesDir and move code to that dir
  fs.mkdirpSync(
    path.join(context.materials.default.basePath, entriesDir, pkgName),
  );
  oldFiles.forEach(file => {
    generator.logger.debug(
      `rename ${file} to ${file.replace(
        entriesDir,
        path.join(entriesDir, pkgName),
      )}`,
    );
    fs.renameSync(
      file,
      file.replace(entriesDir, path.join(entriesDir, pkgName)),
    );
  });
};

const getTplInfo = (clientRoute: ClientRoute, isTs: boolean) => {
  const fileExtra = isTs ? 'tsx' : 'jsx';
  if (clientRoute === ClientRoute.ConventionalRoute) {
    return {
      name: 'pages-router',
      space: '  ',
      fileExtra,
      entry: `Index.${fileExtra}`,
      css: 'index.css',
    };
  } else if (clientRoute === ClientRoute.SelfControlRoute) {
    return {
      name: 'router',
      space: '      ',
      fileExtra,
      entry: `App.${fileExtra}`,
      css: 'App.css',
    };
  }
  return {
    name: 'base',
    space: '  ',
    fileExtra,
    entry: `App.${fileExtra}`,
    css: 'App.css',
  };
};

const getTargetFolder = (
  clientRoute: ClientRoute,
  entriesDir: string,
  entryName: string,
) => {
  let targetPath = path.join(entriesDir, entryName);
  if (clientRoute === ClientRoute.ConventionalRoute) {
    targetPath = path.join(targetPath, 'pages');
  }
  return targetPath;
};

const getSpaUpdateInfo = (
  clientRoute: ClientRoute,
  disableStateManagement: BooleanConfig,
) => {
  const updateInfo: Record<string, unknown> = {};
  if (
    clientRoute === ClientRoute.No &&
    disableStateManagement === BooleanConfig.YES
  ) {
    updateInfo.modernConfig = {};
  }

  if (clientRoute !== ClientRoute.No) {
    updateInfo['modernConfig.runtime.router'] = true;
  }

  if (disableStateManagement === BooleanConfig.NO) {
    updateInfo['modernConfig.runtime.state'] = true;
  }
  return updateInfo;
};

const getMpaUpdateInfo = (
  name: string,
  clientRoute: ClientRoute = ClientRoute.SelfControlRoute,
  disableStateManagement: BooleanConfig = BooleanConfig.NO,
  modernConfig?: Record<string, unknown>,
) => {
  const newFeature = {
    state: disableStateManagement === BooleanConfig.NO,
    router: clientRoute !== ClientRoute.No,
  };
  const updateInfo = {
    [`modernConfig.runtimeByEntries.${name}.state`]: newFeature.state,
    [`modernConfig.runtimeByEntries.${name}.router`]: newFeature.router,
  };
  if (!newFeature.state && !newFeature.router) {
    if (
      !modernConfig ||
      !modernConfig.runtime ||
      !(modernConfig.runtime as Record<string, unknown>)
    ) {
      return {};
    }
  }
  if (modernConfig?.runtime) {
    const preDefaultFeature = modernConfig.runtime as Record<string, unknown>;
    if (isEqual(newFeature, preDefaultFeature)) {
      return {};
    }
  }
  return updateInfo;
};

const updatePackageJSON = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const appDir = context.materials.default.basePath;
  const confPath = path.join(appDir, 'package.json');
  if (!fs.existsSync(confPath)) {
    generator.logger.warn(i18n.t(localeKeys.package_not_exist));
  }
  let updateInfo: Record<string, unknown> = {};

  const { name, clientRoute, disableStateManagement } = context.config;
  if (!name) {
    updateInfo = getSpaUpdateInfo(clientRoute, disableStateManagement);
  } else {
    const pkgObj = await getPackageObj(context);
    const { modernConfig } = pkgObj;
    updateInfo = getMpaUpdateInfo(
      name,
      clientRoute,
      disableStateManagement,
      modernConfig,
    );
  }

  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: { $set: updateInfo },
  });
};

export const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const ans = await handleInput(context, generator, appApi);

  if (ans.isSingleEntry) {
    generator.logger.debug(
      'current is single entry, refactoring to multi entry',
    );
    await refactorSingleEntry(context, generator);
  }

  const entryName = (ans.name as string) || '';
  const { name, space, fileExtra, entry, css } = getTplInfo(
    ans.clientRoute as ClientRoute,
    ans.isTsProject as boolean,
  );
  const targetFolder = getTargetFolder(
    ans.clientRoute as ClientRoute,
    context.config.entriesDir,
    entryName,
  );
  const sourceFolder = `templates/${name}`;

  const mainTpl = await context.current?.material
    .get('templates/main.handlebars')
    .value();
  const main = renderString((mainTpl?.content as string | undefined) || '', {
    space,
    entry,
  });

  await appApi.forgeTemplate(
    `${sourceFolder}/*`,
    undefined,
    resourceKey =>
      resourceKey
        .replace(sourceFolder, targetFolder)
        .replace('.handlebars', `.${fileExtra}`),
    {
      main,
    },
  );

  await appApi.forgeTemplate(
    `templates/main.css`,
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/main.css', `${targetFolder}/${css}`)
        .replace('.handlebars', ''),
    {
      main,
    },
  );

  await updatePackageJSON(context, generator);
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });
  i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/entry-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  merge(context.config, { entriesDir: context.config.entriesDir || 'src' });

  await handleTemplateFile(context, generator, appApi);

  if (!context.config.isEmptySrc) {
    appApi.showSuccessInfo(
      i18n.t(localeKeys.success, { name: context.config.name }),
    );
  }

  generator.logger.debug(`forge @modern-js/entry-generator succeed `);
};
