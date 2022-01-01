import * as path from 'path';
import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import { fs } from '@modern-js/utils';
import yaml from 'js-yaml';
import { getWorkspaceFile } from '../parse-config/monorepo';
import { IPnpmWorkSpace } from '../type';
import {
  getProjetsByPackageConfig,
  syncGetProjetsByPackageConfig,
} from './get-projects-by-packages-config';
import { WORKSPACE_FILE } from '../constants';

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
      path.resolve('/', rootPath, workspaceFile as string),
    ).then(data => data.toString());
    // eslint-disable-next-line import/no-named-as-default-member
    const pnpmWorkspace = yaml.load(yamlString) as IPnpmWorkSpace;
    packagesConfig = pnpmWorkspace.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.YARN) {
    const pkgJson = JsonFile.load(
      path.resolve(rootPath, workspaceFile as string),
    );
    packagesConfig = pkgJson?.workspaces?.packages || [];
  }

  const projects = await getProjetsByPackageConfig(
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
      path.resolve('/', rootPath, workspaceFile as string),
      'utf-8',
    );
    // eslint-disable-next-line import/no-named-as-default-member
    const pnpmWorkspace = yaml.load(yamlString) as IPnpmWorkSpace;
    packagesConfig = pnpmWorkspace.packages || [];
  } else if (workspaceFile === WORKSPACE_FILE.YARN) {
    const pkgJson = JsonFile.load(
      path.resolve(rootPath, workspaceFile as string),
    );
    packagesConfig = pkgJson?.workspaces?.packages || [];
  }

  const projects = syncGetProjetsByPackageConfig(
    rootPath,
    packagesConfig,
    ignoreConfigs,
  );

  return projects;
};
