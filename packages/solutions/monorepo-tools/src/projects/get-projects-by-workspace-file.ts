import * as path from 'path';
import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import { fs, yaml } from '@modern-js/utils';
import { getWorkspaceFile } from '../parse-config/monorepo';
import { IPnpmWorkSpace } from '../type';
import { WORKSPACE_FILE } from '../constants';
import {
  getProjectsByPackageConfig,
  syncGetProjectsByPackageConfig,
} from './get-projects-by-packages-config';

export const getProjectsByWorkspaceFile = async (
  rootPath: string,
  config: {
    enableAutoFinder?: boolean;
    workspaceFile?: string;
  },
  ignoreConfigs: string[],
) => {
  let { workspaceFile } = config;

  if (
    !config.enableAutoFinder &&
    (!('workspaceFile' in config) || config.workspaceFile?.length === 0)
  ) {
    throw new Error(
      'Missing workspaceFile Key or workspaceFile is empty string',
    );
  }

  if (config.enableAutoFinder) {
    workspaceFile = getWorkspaceFile(rootPath);
  }

  let packagesConfig: string[] = [];
  if (workspaceFile === WORKSPACE_FILE.PNPM) {
    const yamlString = await FileSystem.readFileAsync(
      path.resolve('/', rootPath, workspaceFile),
    ).then(data => data.toString());
    const pnpmWorkspace = yaml.load(yamlString) as IPnpmWorkSpace;
    packagesConfig = pnpmWorkspace.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.YARN) {
    const pkgJson = JsonFile.load(path.resolve(rootPath, workspaceFile));
    packagesConfig = pkgJson?.workspaces?.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.LERNA) {
    const lernaJson = JsonFile.load(path.resolve(rootPath, workspaceFile));
    packagesConfig = lernaJson.packages ?? [];
  }

  const projects = await getProjectsByPackageConfig(
    rootPath,
    packagesConfig,
    ignoreConfigs,
  );

  return projects;
};

export const syncGetProjectsByWorkspaceFile = (
  rootPath: string,
  config: {
    enableAutoFinder?: boolean;
    workspaceFile?: string;
  },
  ignoreConfigs: string[],
) => {
  let { workspaceFile } = config;

  if (
    !config.enableAutoFinder &&
    (!('workspaceFile' in config) || config.workspaceFile?.length === 0)
  ) {
    throw new Error(
      'Missing workspaceFile Key or workspaceFile is empty string',
    );
  }

  if (config.enableAutoFinder) {
    workspaceFile = getWorkspaceFile(rootPath);
  }

  let packagesConfig: string[] = [];
  if (workspaceFile === WORKSPACE_FILE.PNPM) {
    const yamlString = fs.readFileSync(
      path.resolve('/', rootPath, workspaceFile),
      'utf-8',
    );
    const pnpmWorkspace = yaml.load(yamlString) as IPnpmWorkSpace;
    packagesConfig = pnpmWorkspace.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.YARN) {
    const pkgJson = JsonFile.load(path.resolve(rootPath, workspaceFile));
    packagesConfig = pkgJson?.workspaces?.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.LERNA) {
    const lernaJson = JsonFile.load(path.resolve(rootPath, workspaceFile));
    packagesConfig = lernaJson.packages ?? [];
  }

  const projects = syncGetProjectsByPackageConfig(
    rootPath,
    packagesConfig,
    ignoreConfigs,
  );

  return projects;
};
