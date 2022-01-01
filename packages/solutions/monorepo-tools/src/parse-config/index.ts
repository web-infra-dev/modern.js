import * as path from 'path';
import { JsonFile } from '@rushstack/node-core-library';
import { getMonorepoBaseData } from './monorepo';
import type { IFindSubProjectConfig } from '../projects/get-projects';

const defaultConfig: IFindSubProjectConfig = {
  // packagesMatchs: {
  //   workspaceFile: 'pnpm-lock.yaml',
  // },
};

export const getFinalConfig = async (currentPath: string = process.cwd()) => {
  // TODO:
  // 1. 初始化获取信息
  // 2. 配置文件是否存在校验

  const monorepo = getMonorepoBaseData(currentPath);
  const userConfig: IFindSubProjectConfig = await JsonFile.loadAsync(
    path.resolve(monorepo.rootPath, 'mono-config.json'),
  );

  const config = { ...defaultConfig, ...userConfig };
  return { monorepo, config };
};

export type { PackageManagerType } from './monorepo';
