import { promisify } from 'util';
import path from 'path';
import { fs, glob as globModule, semver, inquirer } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import axios from './axios';
import loggerModule from './logger';
import { registerPackage, registerGroup, unregisterPackage } from './butter';
import { NPM_REGISTRY } from './constants';
import { addOfficialOwner } from './butter-cache';
// import preValidate from './pre-validate';

const logger = loggerModule.scope('REGISTER');

const glob = promisify(globModule);

const DEFAULT_PKG_VERSION = '1.0.0';
const registryFilenames = ['package.json'];
const registryFolders = ['node_modules'];

const tryManifest = async (dir: string, filename: string) => {
  const loc = path.join(dir, filename);
  if (fs.existsSync(loc)) {
    const data = await fs.readJson(loc);
    return data;
  } else {
    return null;
  }
};

const findManifest = async (dir: string) => {
  for (const registryFilename of registryFilenames) {
    const manifest = await tryManifest(dir, registryFilename);

    if (manifest) {
      return manifest;
    }
  }

  return null;
};

// see https://github.com/yarnpkg/yarn/blob/v1.22.4/src/config.js#L799
const resolveWorkspaces = async (root: string, patterns: string[]) => {
  logger.info('resolve workspaces...');
  const workspaces = {};
  const trailingPattern = `/+(${registryFilenames.join('|')})`;
  // anything under folder (node_modules) should be ignored, thus use the '**' instead of shallow match "*"
  const ignorePatterns = registryFolders.map(
    folder => `/${folder}/**/+(${registryFilenames.join('|')})`,
  );

  const files = await Promise.all(
    patterns.map(pattern =>
      glob(pattern.replace(/\/?$/, trailingPattern), {
        cwd: root,
        ignore: ignorePatterns.map(ignorePattern =>
          pattern.replace(/\/?$/, ignorePattern),
        ),
      }),
    ),
  );

  for (const file of new Set([].concat(...files))) {
    const loc = path.join(root, path.dirname(file));
    const manifest = await findManifest(loc);

    if (!manifest) {
      continue;
    }

    if (!manifest.name) {
      logger.warn('workspace name missing', loc);
      continue;
    }
    if (!manifest.version) {
      logger.warn('workspace version missing', loc);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(workspaces, manifest.name)) {
      logger.error('workspace name duplicate', manifest.name);
    }

    if (manifest.meta) {
      if (manifest.meta.comps || manifest.meta.contains) {
        logger.warn('nested workspace', loc);
        continue;
      } else {
        workspaces[manifest.name] = `^${manifest.version}`;
      }
    }
  }

  return workspaces;
};

const getLatestPkgVersion = async (name: string) => {
  try {
    const res = await axios.get(`${NPM_REGISTRY}/${name}/latest`);
    return res.data.version;
  } catch (err) {
    return null;
  }
};
const getPkgVersion = async (name: string) => {
  const latestVersion = await getLatestPkgVersion(name);
  if (latestVersion) {
    return ask({
      type: 'string',
      message: `latest version for ${name} is ${latestVersion}, please type a new version:`,
      default: semver.inc(latestVersion, 'patch'),
    });
  } else {
    logger.info(
      `no published versions found, use default version: ${DEFAULT_PKG_VERSION}`,
    );
    return DEFAULT_PKG_VERSION;
  }
};

const ask = async config => {
  const { res } = await inquirer.prompt({
    ...config,
    name: 'res',
  });
  return res;
};

export const register = async (
  appDirectory: string,
  modernConfig: NormalizedConfig,
  options: Record<string, any>,
  mode = 'register',
) => {
  logger.start();

  // const {
  //   source: { enableBlockPreValidate },
  // } = modernConfig;
  const { name, version, workspaces, meta } = require(path.resolve(
    appDirectory,
    './package.json',
  ));

  // 暂时先取消可靠性检测
  // const needPreValidate =
  //   // jupiter.config 目前没有办法给注册的配置设置默认值，需要自己判断, @songzhenwei
  //   enableBlockPreValidate === undefined || enableBlockPreValidate;

  // if (needPreValidate) {
  //   preValidate(appDirectory, name, version, meta, logger);
  // }

  if (mode === 'register') {
    addOfficialOwner(appDirectory);
  }

  try {
    if (mode === 'unregister') {
      await unregisterPackage({ name, version }, options);
      logger.complete();
      return;
    }

    if (workspaces) {
      const confirmed = await ask({
        type: 'confirm',
        message:
          'monorepo detected, do you want to publish it as a component group?',
      });

      if (confirmed) {
        if (!meta.name) {
          throw new Error('"name" is missing from "meta" in package.json');
        }
        if (!meta.title) {
          throw new Error('"title" is missing from "meta" in package.json');
        }

        meta.version = await getPkgVersion(meta.name);

        if (!meta.comps) {
          meta.comps = await resolveWorkspaces(
            appDirectory,
            meta.compPackages || workspaces.packages || workspaces,
          );
        }
        await registerGroup(appDirectory, meta, options);
      }
    } else {
      const data = {
        name,
        version,
      };

      await registerPackage(data, options);
    }
    logger.complete();
  } catch (err) {
    logger.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
